import { useMemo } from 'react';
import { useSprint } from '../../../hooks/use-sprint';
import { useTasks } from '../../../hooks/use-tasks';

function asciiBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  return '[' + bar + '] ' + percent + '%';
}

export function TerminalSprintProgress() {
  const { activeSprint } = useSprint();
  const tasks = useTasks();

  const stats = useMemo(() => {
    if (!activeSprint) {
      return { total: 0, completed: 0, inProgress: 0, blocked: 0, pending: 0, percent: 0 };
    }

    const sprintTasks = tasks.filter((t) => t.sprintId === activeSprint.id);
    const total = sprintTasks.length || activeSprint.totalTasks || 0;
    const completed = sprintTasks.filter((t) => t.status === 'completed').length;
    const inProgress = sprintTasks.filter((t) => t.status === 'in_progress').length;
    const blocked = sprintTasks.filter((t) => t.status === 'blocked').length;
    const pending = total - completed - inProgress - blocked;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, blocked, pending, percent };
  }, [activeSprint, tasks]);

  if (!activeSprint) {
    return (
      <div className="p-3 font-mono text-[11px]">
        <span className="terminal-dim">{'> No active sprint'}</span>
      </div>
    );
  }

  return (
    <div className="p-3 border-b border-[#1a3a1a] font-mono text-[11px]">
      <div className="flex items-center justify-between mb-2">
        <span className="terminal-muted">{'## SPRINT ##'}</span>
        <span className="text-[#00ccff] text-[10px]">{activeSprint.name}</span>
      </div>

      {/* ASCII progress bar */}
      <div className="text-[#00ff00] terminal-glow mb-2">
        {asciiBar(stats.percent, 24)}
      </div>

      {/* Stats breakdown */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="text-[#00ff00] w-[12px]">+</span>
          <span className="terminal-dim flex-1">Completed</span>
          <span className="text-[#00ff00]">{stats.completed}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#00ccff] w-[12px]">*</span>
          <span className="terminal-dim flex-1">In Progress</span>
          <span className="text-[#00ccff]">{stats.inProgress}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="terminal-muted w-[12px]">-</span>
          <span className="terminal-dim flex-1">Pending</span>
          <span className="terminal-muted">{stats.pending}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="terminal-error w-[12px]">!</span>
          <span className="terminal-dim flex-1">Blocked</span>
          <span className={stats.blocked > 0 ? 'terminal-error' : 'terminal-dim'}>{stats.blocked}</span>
        </div>
        <div className="border-t border-[#1a3a1a] mt-1 pt-1 flex items-center gap-2">
          <span className="terminal-dim w-[12px]">=</span>
          <span className="terminal-dim flex-1">Total</span>
          <span className="text-[#00ff00]">{stats.total}</span>
        </div>
      </div>
    </div>
  );
}
