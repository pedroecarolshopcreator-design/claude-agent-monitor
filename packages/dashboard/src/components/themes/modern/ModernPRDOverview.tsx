import { useMemo } from 'react';
import { useProjectStore } from '../../../stores/project-store';

interface SectionSummary {
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  percent: number;
}

export function ModernPRDOverview() {
  const { activeProject, tasks } = useProjectStore();

  const sections = useMemo((): SectionSummary[] => {
    if (!activeProject || tasks.length === 0) return [];

    // Group tasks by prdSection
    const sectionMap = new Map<string, SectionSummary>();
    for (const task of tasks) {
      const sectionName = task.prdSection || 'Uncategorized';
      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, {
          name: sectionName,
          total: 0,
          completed: 0,
          inProgress: 0,
          blocked: 0,
          percent: 0,
        });
      }
      const section = sectionMap.get(sectionName)!;
      section.total++;
      if (task.status === 'completed') section.completed++;
      if (task.status === 'in_progress') section.inProgress++;
      if (task.status === 'blocked') section.blocked++;
    }

    // Calculate percentages
    for (const section of sectionMap.values()) {
      section.percent = section.total > 0 ? Math.round((section.completed / section.total) * 100) : 0;
    }

    return Array.from(sectionMap.values());
  }, [activeProject, tasks]);

  if (sections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xs text-cam-text-muted">PRD Overview</p>
          <p className="text-[10px] text-cam-text-muted mt-1">
            Import a PRD to see section progress
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-cam-text-muted font-medium">
          PRD Sections
        </span>
        <span className="text-[10px] text-cam-text-secondary">
          {activeProject?.name}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto modern-scrollbar pb-1">
        {sections.map((section) => {
          const statusColor =
            section.percent === 100
              ? 'border-green-500/40 bg-green-500/5'
              : section.blocked > 0
                ? 'border-red-500/40 bg-red-500/5'
                : section.inProgress > 0
                  ? 'border-yellow-500/40 bg-yellow-500/5'
                  : 'border-cam-border/40 bg-cam-surface/30';

          return (
            <div
              key={section.name}
              className={`shrink-0 w-48 rounded-lg border p-3 transition-colors ${statusColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-medium text-cam-text truncate flex-1">
                  {section.name}
                </h4>
                <span className="text-[10px] font-mono text-cam-text-secondary ml-2">
                  {section.percent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-cam-surface-3 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    section.percent === 100
                      ? 'bg-green-400'
                      : section.blocked > 0
                        ? 'bg-red-400'
                        : 'bg-cam-accent'
                  }`}
                  style={{ width: `${section.percent}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-[9px] text-cam-text-muted">
                <span>{section.completed}/{section.total} done</span>
                {section.inProgress > 0 && (
                  <span className="text-yellow-400">{section.inProgress} active</span>
                )}
                {section.blocked > 0 && (
                  <span className="text-red-400">{section.blocked} blocked</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
