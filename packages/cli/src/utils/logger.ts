import chalk from 'chalk';

export const logger = {
  info(message: string): void {
    console.log(chalk.blue('  info'), message);
  },

  success(message: string): void {
    console.log(chalk.green('  done'), message);
  },

  warning(message: string): void {
    console.log(chalk.yellow('  warn'), message);
  },

  error(message: string): void {
    console.error(chalk.red('  error'), message);
  },

  item(message: string): void {
    console.log(chalk.gray('    -'), message);
  },

  blank(): void {
    console.log();
  },

  banner(): void {
    console.log();
    console.log(chalk.bold.cyan('  Claude Agent Monitor') + chalk.gray(' v1.0.0'));
    console.log();
  },

  section(title: string): void {
    console.log(chalk.bold(`  ${title}`));
  },

  keyValue(key: string, value: string): void {
    console.log(`  ${chalk.gray(key + ':')} ${value}`);
  },

  table(rows: Array<{ label: string; value: string }>): void {
    const maxLabel = Math.max(...rows.map((r) => r.label.length));
    for (const row of rows) {
      console.log(`    ${chalk.gray(row.label.padEnd(maxLabel))}  ${row.value}`);
    }
  },
};
