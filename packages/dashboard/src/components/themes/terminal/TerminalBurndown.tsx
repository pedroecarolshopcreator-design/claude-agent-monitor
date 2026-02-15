import { useMemo, useState } from 'react';
import { useProjectStore } from '../../../stores/project-store';

type ChartMode = 'burndown' | 'burnup';

export function TerminalBurndown() {
  const { activeSprint, tasks } = useProjectStore();
  const [mode, setMode] = useState<ChartMode>('burndown');

  const { chart, maxVal } = useMemo(() => {
    if (!activeSprint) return { chart: [] as { label: string; actual: number; ideal: number }[], maxVal: 0 };

    const sprintTasks = tasks.filter((t) => t.sprintId === activeSprint.id);
    const total = sprintTasks.length;
    if (total === 0) return { chart: [] as { label: string; actual: number; ideal: number }[], maxVal: 0 };

    const completedTasks = sprintTasks
      .filter((t) => t.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

    const startTime = activeSprint.startedAt
      ? new Date(activeSprint.startedAt).getTime()
      : Date.now() - 3600_000;
    const endTime = Date.now();
    const duration = endTime - startTime;
    const points = 10;

    const data: { label: string; actual: number; ideal: number }[] = [];
    for (let i = 0; i <= points; i++) {
      const time = startTime + (duration / points) * i;
      const completedByTime = completedTasks.filter(
        (t) => new Date(t.completedAt!).getTime() <= time
      ).length;

      const hours = new Date(time).getHours();
      const minutes = new Date(time).getMinutes();
      const label = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      if (mode === 'burndown') {
        data.push({
          label,
          actual: total - completedByTime,
          ideal: Math.max(0, Math.round(total - (total / points) * i)),
        });
      } else {
        data.push({
          label,
          actual: completedByTime,
          ideal: Math.round((total / points) * i),
        });
      }
    }

    const max = Math.max(total, ...data.map((d) => Math.max(d.actual, d.ideal)));
    return { chart: data, maxVal: max };
  }, [activeSprint, tasks, mode]);

  if (!activeSprint || chart.length === 0) {
    return (
      <div className="p-3 border-b border-[#1a3a1a] font-mono text-[11px]">
        <div className="flex items-center justify-between mb-2">
          <span className="terminal-muted">{'## BURNDOWN ##'}</span>
        </div>
        <div className="terminal-dim text-center py-4">
          {'> No data available'}
        </div>
      </div>
    );
  }

  // Render ASCII chart
  const chartHeight = 8;
  const chartWidth = chart.length;

  // Build rows top-to-bottom
  const rows: string[] = [];
  for (let row = chartHeight; row >= 0; row--) {
    const threshold = (row / chartHeight) * maxVal;
    let line = '';
    for (let col = 0; col < chartWidth; col++) {
      const d = chart[col];
      const actualAbove = d.actual >= threshold;
      const idealAbove = d.ideal >= threshold;

      if (actualAbove && idealAbove) {
        line += '#';
      } else if (actualAbove) {
        line += '*';
      } else if (idealAbove) {
        line += '.';
      } else {
        line += ' ';
      }
      // Add spacing between columns
      line += ' ';
    }
    rows.push(line);
  }

  return (
    <div className="p-3 border-b border-[#1a3a1a] font-mono text-[11px]">
      <div className="flex items-center justify-between mb-2">
        <span className="terminal-muted">
          {'## ' + (mode === 'burndown' ? 'BURNDOWN' : 'BURNUP') + ' ##'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('burndown')}
            className={`px-1.5 py-0.5 text-[9px] border ${
              mode === 'burndown'
                ? 'text-[#00ff00] border-[#00aa00] bg-[#0a1f0a]'
                : 'terminal-dim border-[#1a3a1a]'
            }`}
          >
            DN
          </button>
          <button
            onClick={() => setMode('burnup')}
            className={`px-1.5 py-0.5 text-[9px] border ${
              mode === 'burnup'
                ? 'text-[#00ff00] border-[#00aa00] bg-[#0a1f0a]'
                : 'terminal-dim border-[#1a3a1a]'
            }`}
          >
            UP
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div className="bg-[#050505] border border-[#1a3a1a] p-2 text-[10px]">
        {/* Y-axis label + chart rows */}
        <div className="flex">
          <div className="flex flex-col justify-between text-right pr-1 terminal-dim text-[9px] shrink-0 w-[20px]">
            <span>{maxVal}</span>
            <span>{Math.round(maxVal / 2)}</span>
            <span>0</span>
          </div>
          <div className="flex-1">
            <div className="border-l border-b border-[#1a3a1a] pl-1 pb-1">
              {rows.map((row, i) => (
                <div key={i} className="leading-none">
                  <span className="text-[#00ff00]">
                    {row.split('').map((ch, j) => {
                      if (ch === '*') return <span key={j} className="text-[#00ff00] terminal-glow">{ch}</span>;
                      if (ch === '.') return <span key={j} className="terminal-dim">{ch}</span>;
                      if (ch === '#') return <span key={j} className="text-[#00ccff]">{ch}</span>;
                      return <span key={j}>{ch}</span>;
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-1 text-[9px]">
          <span className="text-[#00ff00]">* actual</span>
          <span className="terminal-dim">. ideal</span>
          <span className="text-[#00ccff]"># overlap</span>
        </div>
      </div>
    </div>
  );
}
