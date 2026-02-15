import { useRef, useEffect, useState } from 'react';
import { useFilterStore } from '../../../stores/filter-store';
import { useEvents } from '../../../hooks/use-events';
import { formatTimestamp, truncatePath } from '../../../lib/formatters';
import type { AgentEvent } from '@cam/shared';

const TOOL_SYMBOLS: Record<string, string> = {
  Edit: 'EDT',
  Write: 'WRT',
  Read: 'RD ',
  Bash: 'SH ',
  Grep: 'GRP',
  Glob: 'GLB',
  TaskCreate: 'T+ ',
  TaskUpdate: 'T~ ',
  TaskList: 'TL ',
  SendMessage: 'MSG',
  WebFetch: 'GET',
  WebSearch: 'WEB',
};

const CATEGORY_PREFIX: Record<string, string> = {
  tool_call: 'TOOL',
  file_change: 'FILE',
  command: 'CMD ',
  message: 'MSG ',
  lifecycle: 'SYS ',
  error: 'ERR ',
  compact: 'CMP ',
  notification: 'NTF ',
};

export function TerminalActivityFeed() {
  const events = useEvents();
  const { followMode, toggleFollowMode, searchQuery, setSearchQuery } = useFilterStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (followMode && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length, followMode]);

  const filteredEvents = searchQuery
    ? events.filter(
        (e) =>
          e.tool?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.filePath?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.input?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.output?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

  return (
    <div className="h-full flex flex-col font-mono text-[11px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1a3a1a] shrink-0">
        <span className="terminal-muted">
          {'## tail -f activity.log (' + filteredEvents.length + ' lines) ##'}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="terminal-dim mr-1">grep:</span>
            <input
              type="text"
              placeholder="..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-24 bg-[#0d0d0d] border border-[#1a3a1a] px-1.5 py-0.5 text-[11px] text-[#00ff00] font-mono placeholder:text-[#003300] focus:outline-none focus:border-[#00aa00]"
            />
          </div>
          <button
            onClick={toggleFollowMode}
            className={`px-2 py-0.5 font-mono text-[10px] border ${
              followMode
                ? 'bg-[#0a1f0a] text-[#00ff00] border-[#00aa00] terminal-glow'
                : 'bg-[#0d0d0d] text-[#006600] border-[#1a3a1a]'
            }`}
          >
            {followMode ? '[F]ollow:ON' : '[F]ollow:OFF'}
          </button>
        </div>
      </div>

      {/* Log Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto terminal-scrollbar">
        {filteredEvents.length === 0 ? (
          <div className="p-4 text-center">
            <div className="terminal-dim">
              <p>{'> No activity logged'}</p>
              <p>{'> Waiting for events...'}</p>
              <p className="mt-2 terminal-cursor">{'> '}</p>
            </div>
          </div>
        ) : (
          <div>
            {filteredEvents.map((event) => (
              <LogLine
                key={event.id}
                event={event}
                isExpanded={expandedId === event.id}
                onToggle={() =>
                  setExpandedId(expandedId === event.id ? null : event.id)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogLine({
  event,
  isExpanded,
  onToggle,
}: {
  event: AgentEvent;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const toolSym = TOOL_SYMBOLS[event.tool || ''] || '...';
  const catPrefix = CATEGORY_PREFIX[event.category] || '??? ';
  const isError = event.category === 'error' || !!event.error;

  return (
    <div
      className={`px-3 py-0.5 hover:bg-[#0a1a0a] cursor-pointer transition-colors border-l-2 ${
        isError ? 'border-[#ff3333]' : isExpanded ? 'border-[#00ff00]' : 'border-transparent'
      }`}
      onClick={onToggle}
    >
      {/* Main log line */}
      <div className="flex items-center gap-0 whitespace-nowrap overflow-hidden">
        <span className="terminal-dim shrink-0 w-[60px]">
          {formatTimestamp(event.timestamp)}
        </span>
        <span className={`shrink-0 w-[36px] ml-1 ${isError ? 'terminal-error' : 'terminal-muted'}`}>
          {catPrefix}
        </span>
        <span className="shrink-0 w-[28px] ml-1 text-[#00ccff]">
          {toolSym}
        </span>
        <span className="terminal-dim shrink-0 ml-1">
          [{event.agentId.slice(0, 8)}]
        </span>
        {event.filePath && (
          <span className="text-[#00aa00] ml-2 truncate">
            {truncatePath(event.filePath)}
          </span>
        )}
        {event.error && (
          <span className="terminal-error ml-2 truncate">
            {event.error}
          </span>
        )}
        {event.duration !== undefined && (
          <span className="terminal-dim ml-auto shrink-0 pl-2">
            {event.duration}ms
          </span>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="ml-4 mt-1 mb-1 border-l border-[#1a3a1a] pl-2">
          {event.input && (
            <div className="mb-1">
              <span className="terminal-muted">{'>>> INPUT:'}</span>
              <pre className="text-[10px] text-[#00aa00] whitespace-pre-wrap break-all mt-0.5 max-h-28 overflow-y-auto terminal-scrollbar bg-[#050505] p-1 border border-[#1a3a1a]">
                {event.input}
              </pre>
            </div>
          )}
          {event.output && (
            <div className="mb-1">
              <span className="terminal-muted">{'<<< OUTPUT:'}</span>
              <pre className="text-[10px] text-[#00aa00] whitespace-pre-wrap break-all mt-0.5 max-h-28 overflow-y-auto terminal-scrollbar bg-[#050505] p-1 border border-[#1a3a1a]">
                {event.output}
              </pre>
            </div>
          )}
          {event.duration !== undefined && (
            <span className="terminal-dim text-[10px]">
              {'--- duration: ' + event.duration + 'ms ---'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
