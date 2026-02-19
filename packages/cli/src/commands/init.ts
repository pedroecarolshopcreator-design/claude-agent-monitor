import { Command } from "commander";
import chalk from "chalk";
import { basename } from "node:path";
import { execSync } from "node:child_process";
import { DEFAULT_SERVER_PORT } from "@claudecam/shared";
import { logger } from "../utils/logger.js";
import {
  claudeSettingsExist,
  readClaudeSettings,
  writeClaudeSettings,
  ensureClaudeDir,
  readConfig,
  writeConfig,
} from "../utils/config.js";
import {
  generateHooksConfig,
  mergeHooks,
  HOOK_TYPE_DESCRIPTIONS,
  type HookEntry,
  isCamHook,
} from "../utils/hooks-config.js";
import { scaffoldDocs } from "../utils/scaffold-docs.js";

export const initCommand = new Command("init")
  .description("Initialize Claude Agent Monitor hooks in the current project")
  .option("--force", "Overwrite existing hooks configuration")
  .option("-p, --port <port>", "Server port (hooks will send events to this port)", String(DEFAULT_SERVER_PORT))
  .action(
    async (options: { force?: boolean; port: string }) => {
      const serverPort = parseInt(options.port, 10) || DEFAULT_SERVER_PORT;
      logger.blank();
      logger.section("Claude Agent Monitor - Initializing...");
      logger.blank();

      // Check if cam-hook binary is available in PATH
      const camHookAvailable = checkCamHookAvailable();
      if (!camHookAvailable) {
        logger.warning(
          `${chalk.cyan("cam-hook")} not found in PATH. Hooks may not work.`,
        );
        logger.info(
          `Install globally: ${chalk.cyan("npm install -g claude-agent-monitor")}`,
        );
        logger.blank();
      }

      const settingsExist = claudeSettingsExist();
      const camHooks = generateHooksConfig(serverPort);
      const hookCount = Object.keys(HOOK_TYPE_DESCRIPTIONS).length;

      if (settingsExist && !options.force) {
        // Merge mode: preserve existing hooks, add/update CAM hooks
        const existing = readClaudeSettings();
        const existingHooks = (existing.hooks ?? {}) as Record<
          string,
          HookEntry[]
        >;

        // Count user hooks that will be preserved
        let preservedCount = 0;
        for (const entries of Object.values(existingHooks)) {
          preservedCount += entries.filter((e) => !isCamHook(e)).length;
        }

        const merged = mergeHooks(existing, camHooks);
        writeClaudeSettings(merged);

        logger.success(
          `Merged hooks into existing ${chalk.cyan(".claude/settings.json")}`,
        );
        if (preservedCount > 0) {
          logger.info(
            `Preserved ${chalk.yellow(String(preservedCount))} existing user hook(s)`,
          );
        }
      } else {
        // Create mode: create new settings with hooks
        ensureClaudeDir();
        const settings = { hooks: camHooks };
        writeClaudeSettings(settings);

        if (settingsExist && options.force) {
          logger.success(
            `Overwrote ${chalk.cyan(".claude/settings.json")} (--force)`,
          );
        } else {
          logger.success(`Created ${chalk.cyan(".claude/settings.json")}`);
        }
      }

      // Display configured hooks summary
      logger.blank();
      logger.section(`Configured ${hookCount} hooks:`);
      for (const [hookType, description] of Object.entries(
        HOOK_TYPE_DESCRIPTIONS,
      )) {
        logger.item(
          `${chalk.white(hookType)} ${chalk.gray(`(${description})`)}`,
        );
      }

      // Scaffold docs structure (PRD + Sprints)
      logger.blank();
      logger.section("Docs Structure");
      const docsResult = scaffoldDocs();
      if (docsResult.created.length > 0) {
        for (const path of docsResult.created) {
          logger.success(`Created ${chalk.cyan(path)}`);
        }
      } else {
        logger.info("Docs structure already exists");
      }

      // === Project Registration (Sprint 8: Project-First Architecture) ===
      logger.blank();
      logger.section("Project Registration");

      let projectId: string | null = null;
      let serverAvailable = false;

      // Check if server is running
      try {
        const healthRes = await fetch(
          `http://localhost:${serverPort}/api/health`,
        );
        serverAvailable = healthRes.ok;
      } catch {
        serverAvailable = false;
      }

      if (!serverAvailable) {
        logger.info(
          `Server not running. Start with ${chalk.cyan("'cam start'")} then re-run ${chalk.cyan("'cam init'")} to register this project.`,
        );
      } else {
        // Check if project already registered for this directory
        try {
          const cwd = process.cwd();
          const lookupRes = await fetch(
            `http://localhost:${serverPort}/api/registry/lookup?dir=${encodeURIComponent(cwd)}`,
          );
          if (lookupRes.ok) {
            const lookupData = (await lookupRes.json()) as {
              registry?: { project_id?: string; project_name?: string };
            };
            if (lookupData.registry?.project_id) {
              projectId = lookupData.registry.project_id;
              const name = lookupData.registry.project_name ?? projectId.slice(0, 8);
              logger.success(`Project already registered: ${chalk.cyan(name)}`);
            }
          }
        } catch {
          // Registry lookup failed, will try to create
        }

        // Create project only if not already registered
        if (!projectId) {
          try {
            const projName = basename(process.cwd());
            const response = await fetch(
              `http://localhost:${serverPort}/api/projects`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: projName, prd_content: "" }),
              },
            );

            if (response.ok) {
              const data = (await response.json()) as {
                project?: { id: string; name: string };
              };
              if (data.project) {
                projectId = data.project.id;
                logger.success(`Project created: ${chalk.cyan(data.project.name)}`);
              }
            }
          } catch {
            logger.warning("Failed to create project");
          }

          // Register working directory for new project
          if (projectId) {
            try {
              const regResponse = await fetch(
                `http://localhost:${serverPort}/api/registry`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    working_directory: process.cwd(),
                    project_id: projectId,
                    prd_path: null,
                  }),
                },
              );

              if (regResponse.ok) {
                logger.success("Directory registered with CAM");
              }
            } catch {
              logger.warning("Failed to register directory");
            }
          }
        }

        // Save activeProjectId to local config (always, whether new or existing)
        if (projectId) {
          try {
            const config = readConfig();
            writeConfig({ ...config, activeProjectId: projectId });
            logger.success("Project ID saved to config");
          } catch {
            // Config save failed silently
          }
        }
      }

      // Test server connectivity
      logger.blank();
      try {
        const response = await fetch(
          `http://localhost:${serverPort}/api/sessions`,
        );
        if (response.ok) {
          logger.success(
            `Server is running at ${chalk.cyan(`http://localhost:${DEFAULT_SERVER_PORT}`)}`,
          );
        }
      } catch {
        if (!serverAvailable) {
          logger.info(
            `Run ${chalk.cyan("'cam start'")} to launch the monitoring server.`,
          );
        }
      }

      // Next steps
      logger.blank();
      logger.section("Next steps");
      logger.info(`1. Create a sprint: ${chalk.cyan("cp docs/SPRINTS/TEMPLATE.md docs/SPRINTS/sprint-01.md")}`);
      logger.info(`2. Edit the file with your tasks`);
      logger.info(`3. Import:          ${chalk.cyan("cam sprint sync")}`);
      logger.blank();
      logger.info(chalk.gray(`Observability is active! Sprint tracking is optional.`));
      logger.blank();
    },
  );

function checkCamHookAvailable(): boolean {
  try {
    const cmd =
      process.platform === "win32" ? "where cam-hook" : "which cam-hook";
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
