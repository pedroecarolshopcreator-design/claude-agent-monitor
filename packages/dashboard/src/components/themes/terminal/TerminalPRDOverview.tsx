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

function miniBar(percent: number, width: number = 12): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
}

export function TerminalPRDOverview() {
  const { activeProject, tasks } = useProjectStore();

  const sections = useMemo((): SectionSummary[] => {
    if (!activeProject || tasks.length === 0) return [];

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

    for (const section of sectionMap.values()) {
      section.percent = section.total > 0 ? Math.round((section.completed / section.total) * 100) : 0;
    }

    return Array.from(sectionMap.values());
  }, [activeProject, tasks]);

  if (sections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center font-mono text-[11px]">
        <div className="terminal-dim text-center">
          <p>{'## PRD OVERVIEW ##'}</p>
          <p className="mt-1">{'> Import a PRD to see section progress'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 font-mono text-[11px]">
      <div className="flex items-center justify-between mb-2">
        <span className="terminal-muted">{'## PRD SECTIONS ##'}</span>
        <span className="text-[#00ccff] text-[10px]">{activeProject?.name}</span>
      </div>

      {/* Sections as a table */}
      <div className="border border-[#1a3a1a] bg-[#050505]">
        {/* Table header */}
        <div className="flex items-center gap-0 px-2 py-1 border-b border-[#1a3a1a] terminal-dim text-[10px]">
          <span className="flex-1">SECTION</span>
          <span className="w-[110px] text-center">PROGRESS</span>
          <span className="w-[40px] text-right">DONE</span>
          <span className="w-[30px] text-right">ACT</span>
          <span className="w-[30px] text-right">BLK</span>
        </div>

        {sections.map((section) => {
          const statusColor = section.percent === 100
            ? 'text-[#00ff00]'
            : section.blocked > 0
              ? 'terminal-error'
              : section.inProgress > 0
                ? 'text-[#00ccff]'
                : 'terminal-dim';

          return (
            <div
              key={section.name}
              className="flex items-center gap-0 px-2 py-0.5 hover:bg-[#0a1a0a] transition-colors border-b border-[#0a1a0a] text-[10px]"
            >
              <span className="flex-1 truncate text-[#00cc00]">
                {section.name}
              </span>
              <span className={`w-[110px] text-center ${statusColor}`}>
                {miniBar(section.percent)} {section.percent}%
              </span>
              <span className="w-[40px] text-right text-[#00ff00]">
                {section.completed}/{section.total}
              </span>
              <span className={`w-[30px] text-right ${section.inProgress > 0 ? 'text-[#00ccff]' : 'terminal-dim'}`}>
                {section.inProgress}
              </span>
              <span className={`w-[30px] text-right ${section.blocked > 0 ? 'terminal-error' : 'terminal-dim'}`}>
                {section.blocked}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
