import { useMemo } from 'react';
import { useProjectStore } from '../../../stores/project-store';
import { getTaskStatusColor, generateIdenticon } from '../../../lib/formatters';

interface GraphNode {
  id: string;
  title: string;
  status: string;
  x: number;
  y: number;
  dependsOn: string[];
}

export function ModernDependencyGraph() {
  const { tasks } = useProjectStore();

  const graphData = useMemo(() => {
    const tasksWithDeps = tasks.filter(
      (t) => t.dependsOn.length > 0 || tasks.some((other) => other.dependsOn.includes(t.id))
    );

    if (tasksWithDeps.length === 0) return null;

    // Simple layout: arrange nodes in rows by dependency depth
    const depthMap = new Map<string, number>();

    function getDepth(taskId: string, visited = new Set<string>()): number {
      if (visited.has(taskId)) return 0;
      visited.add(taskId);

      if (depthMap.has(taskId)) return depthMap.get(taskId)!;
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.dependsOn.length === 0) {
        depthMap.set(taskId, 0);
        return 0;
      }

      const maxDep = Math.max(...task.dependsOn.map((d) => getDepth(d, visited)));
      const depth = maxDep + 1;
      depthMap.set(taskId, depth);
      return depth;
    }

    tasksWithDeps.forEach((t) => getDepth(t.id));

    // Group by depth
    const depthGroups = new Map<number, typeof tasksWithDeps>();
    for (const task of tasksWithDeps) {
      const depth = depthMap.get(task.id) || 0;
      if (!depthGroups.has(depth)) depthGroups.set(depth, []);
      depthGroups.get(depth)!.push(task);
    }

    const maxDepth = Math.max(...Array.from(depthGroups.keys()), 0);
    const nodes: GraphNode[] = [];

    for (const [depth, group] of depthGroups) {
      group.forEach((task, i) => {
        nodes.push({
          id: task.id,
          title: task.title.slice(0, 20),
          status: task.status,
          x: 40 + (depth / Math.max(maxDepth, 1)) * 220,
          y: 20 + i * 40 + (depth % 2) * 15,
          dependsOn: task.dependsOn,
        });
      });
    }

    return nodes;
  }, [tasks]);

  if (!graphData || graphData.length === 0) {
    return (
      <div className="p-4 border-b border-cam-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-cam-text-muted font-medium">
            Dependencies
          </span>
        </div>
        <div className="h-24 flex items-center justify-center">
          <p className="text-[10px] text-cam-text-muted">No task dependencies</p>
        </div>
      </div>
    );
  }

  const maxY = Math.max(...graphData.map((n) => n.y)) + 40;
  const height = Math.max(maxY, 80);

  return (
    <div className="p-4 border-b border-cam-border/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-cam-text-muted font-medium">
          Dependencies
        </span>
        <span className="text-[9px] text-cam-text-muted">{graphData.length} nodes</span>
      </div>

      <div className="overflow-auto modern-scrollbar">
        <svg width="300" height={height} className="w-full">
          {/* Edges */}
          {graphData.map((node) =>
            node.dependsOn.map((depId) => {
              const dep = graphData.find((n) => n.id === depId);
              if (!dep) return null;
              return (
                <line
                  key={`${dep.id}-${node.id}`}
                  x1={dep.x + 10}
                  y1={dep.y + 10}
                  x2={node.x}
                  y2={node.y + 10}
                  stroke="#3a3a3a"
                  strokeWidth={1}
                  markerEnd="url(#arrow)"
                />
              );
            })
          )}

          {/* Arrow marker */}
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3a3a3a" />
            </marker>
          </defs>

          {/* Nodes */}
          {graphData.map((node) => {
            const statusColor = node.status === 'completed'
              ? '#22c55e'
              : node.status === 'in_progress'
                ? '#3b82f6'
                : node.status === 'blocked'
                  ? '#ef4444'
                  : '#666';

            return (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={80}
                  height={20}
                  rx={4}
                  fill="#191919"
                  stroke={statusColor}
                  strokeWidth={1}
                />
                <text
                  x={node.x + 40}
                  y={node.y + 13}
                  textAnchor="middle"
                  fill="#a1a1a1"
                  fontSize={8}
                  fontFamily="Inter, sans-serif"
                >
                  {node.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
