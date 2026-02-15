import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useProjectStore } from '../../../stores/project-store';

type ChartMode = 'burndown' | 'burnup';

export function ModernBurndown() {
  const { activeSprint, tasks } = useProjectStore();
  const [mode, setMode] = useState<ChartMode>('burndown');

  const chartData = useMemo(() => {
    if (!activeSprint) return [];

    const sprintTasks = tasks.filter((t) => t.sprintId === activeSprint.id);
    const total = sprintTasks.length;
    if (total === 0) return [];

    // Generate time-based data points from completed tasks
    const completedTasks = sprintTasks
      .filter((t) => t.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

    const startTime = activeSprint.startedAt
      ? new Date(activeSprint.startedAt).getTime()
      : Date.now() - 3600_000;
    const endTime = Date.now();
    const duration = endTime - startTime;
    const points = 12;

    const data = [];
    for (let i = 0; i <= points; i++) {
      const time = startTime + (duration / points) * i;
      const completedByTime = completedTasks.filter(
        (t) => new Date(t.completedAt!).getTime() <= time
      ).length;

      const idealRemaining = Math.max(0, total - (total / points) * i);
      const idealCompleted = (total / points) * i;

      const hours = new Date(time).getHours();
      const minutes = new Date(time).getMinutes();
      const label = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      data.push({
        time: label,
        remaining: total - completedByTime,
        completed: completedByTime,
        ideal: mode === 'burndown' ? Math.round(idealRemaining) : Math.round(idealCompleted),
      });
    }

    return data;
  }, [activeSprint, tasks, mode]);

  if (!activeSprint || chartData.length === 0) {
    return (
      <div className="p-4 border-b border-cam-border/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-wider text-cam-text-muted font-medium">
            Burndown Chart
          </span>
        </div>
        <div className="h-32 flex items-center justify-center">
          <p className="text-[10px] text-cam-text-muted">No data available</p>
        </div>
      </div>
    );
  }

  const dataKey = mode === 'burndown' ? 'remaining' : 'completed';

  return (
    <div className="p-4 border-b border-cam-border/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider text-cam-text-muted font-medium">
          {mode === 'burndown' ? 'Burndown' : 'Burnup'} Chart
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('burndown')}
            className={`px-2 py-0.5 rounded text-[9px] font-medium ${
              mode === 'burndown'
                ? 'bg-cam-accent/20 text-cam-accent'
                : 'text-cam-text-muted hover:text-cam-text-secondary'
            }`}
          >
            Down
          </button>
          <button
            onClick={() => setMode('burnup')}
            className={`px-2 py-0.5 rounded text-[9px] font-medium ${
              mode === 'burnup'
                ? 'bg-cam-accent/20 text-cam-accent'
                : 'text-cam-text-muted hover:text-cam-text-secondary'
            }`}
          >
            Up
          </button>
        </div>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: '#666' }}
              axisLine={{ stroke: '#2a2a2a' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#666' }}
              axisLine={{ stroke: '#2a2a2a' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                fontSize: '10px',
                color: '#fafafa',
              }}
            />
            {/* Ideal Line */}
            <Area
              type="monotone"
              dataKey="ideal"
              stroke="#666"
              strokeDasharray="4 4"
              fill="none"
              strokeWidth={1}
            />
            {/* Actual Line */}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#3b82f6"
              fill="url(#colorActual)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
