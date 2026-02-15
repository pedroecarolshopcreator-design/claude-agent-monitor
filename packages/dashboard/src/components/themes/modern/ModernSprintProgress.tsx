import { useMemo } from 'react';
import { useProjectStore } from '../../../stores/project-store';
import { useSprint } from '../../../hooks/use-sprint';
import { useTasks } from '../../../hooks/use-tasks';

export function ModernSprintProgress() {
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
      <div className="p-4 text-center">
        <p className="text-xs text-cam-text-muted">No active sprint</p>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (stats.percent / 100) * circumference;

  return (
    <div className="p-4 border-b border-cam-border/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider text-cam-text-muted font-medium">
          Sprint Progress
        </span>
        <span className="text-[10px] text-cam-text-secondary font-medium">
          {activeSprint.name}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Progress Ring */}
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="rgba(42, 42, 42, 0.5)"
              strokeWidth="6"
            />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-cam-text">{stats.percent}%</span>
            <span className="text-[9px] text-cam-text-muted">
              {stats.completed}/{stats.total}
            </span>
          </div>
        </div>

        {/* Stats Breakdown */}
        <div className="flex-1 space-y-1.5">
          {[
            { label: 'Completed', value: stats.completed, color: 'bg-green-400' },
            { label: 'In Progress', value: stats.inProgress, color: 'bg-emerald-400' },
            { label: 'Pending', value: stats.pending, color: 'bg-yellow-400' },
            { label: 'Blocked', value: stats.blocked, color: 'bg-red-400' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
              <span className="text-[10px] text-cam-text-secondary flex-1">{item.label}</span>
              <span className="text-[10px] font-mono text-cam-text font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
