import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '../../../stores/session-store';
import { useFilterStore } from '../../../stores/filter-store';
import { useEvents } from '../../../hooks/use-events';
import {
  formatTimestamp,
  getCategoryColor,
  truncatePath,
} from '../../../lib/formatters';
import type { AgentEvent } from '@cam/shared';

const TOOL_ICONS: Record<string, string> = {
  Edit: '\u270F',
  Write: '\u2795',
  Read: '\u{1F441}',
  Bash: '\u{1F4BB}',
  Grep: '\u{1F50D}',
  Glob: '\u{1F4C2}',
  TaskCreate: '\u{2795}',
  TaskUpdate: '\u{1F504}',
  TaskList: '\u{1F4CB}',
  SendMessage: '\u{1F4AC}',
  WebFetch: '\u{1F310}',
  WebSearch: '\u{1F50E}',
};

export function ModernActivityFeed() {
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
    <div className="h-full flex flex-col">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-cam-border/30 shrink-0">
        <span className="text-[10px] uppercase tracking-wider text-cam-text-muted font-medium">
          Activity Feed ({filteredEvents.length})
        </span>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 h-6 bg-cam-surface-2 border border-cam-border rounded-md px-2 text-[11px] text-cam-text placeholder:text-cam-text-muted focus:outline-none focus:border-cam-accent/50 transition-colors"
            />
          </div>

          {/* Follow Mode */}
          <button
            onClick={toggleFollowMode}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              followMode
                ? 'bg-cam-accent/20 text-cam-accent border border-cam-accent/30'
                : 'bg-cam-surface-2 text-cam-text-muted border border-cam-border'
            }`}
          >
            {followMode ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>

      {/* Event List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto modern-scrollbar">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-12 h-12 rounded-full bg-cam-surface-2 border border-cam-border flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-cam-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm text-cam-text-muted">No activity yet</p>
            <p className="text-xs text-cam-text-muted mt-1">Events will appear here in real-time</p>
          </div>
        ) : (
          <div className="divide-y divide-cam-border/20">
            <AnimatePresence initial={false}>
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <EventItem
                    event={event}
                    isExpanded={expandedId === event.id}
                    onToggle={() =>
                      setExpandedId(expandedId === event.id ? null : event.id)
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function EventItem({
  event,
  isExpanded,
  onToggle,
}: {
  event: AgentEvent;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const icon = TOOL_ICONS[event.tool || ''] || '\u25CF';
  const categoryColor = getCategoryColor(event.category);

  return (
    <div
      className={`px-4 py-2 hover:bg-cam-surface/40 cursor-pointer transition-colors ${
        isExpanded ? 'bg-cam-surface/30' : ''
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-sm mt-0.5 w-5 text-center shrink-0">{icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${categoryColor}`}>
              {event.tool || event.hookType}
            </span>
            <span className="text-[10px] text-cam-text-muted">
              {event.agentId}
            </span>
            {event.filePath && (
              <span className="text-[10px] text-cam-text-secondary font-mono truncate">
                {truncatePath(event.filePath)}
              </span>
            )}
          </div>

          {event.error && (
            <p className="text-[11px] text-cam-error mt-0.5 truncate">
              {event.error}
            </p>
          )}

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2">
                  {event.input && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-cam-text-muted">Input</span>
                      <pre className="mt-0.5 text-[11px] text-cam-text-secondary font-mono bg-cam-bg rounded p-2 overflow-x-auto max-h-32 modern-scrollbar whitespace-pre-wrap break-all">
                        {event.input}
                      </pre>
                    </div>
                  )}
                  {event.output && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-cam-text-muted">Output</span>
                      <pre className="mt-0.5 text-[11px] text-cam-text-secondary font-mono bg-cam-bg rounded p-2 overflow-x-auto max-h-32 modern-scrollbar whitespace-pre-wrap break-all">
                        {event.output}
                      </pre>
                    </div>
                  )}
                  {event.duration !== undefined && (
                    <span className="text-[10px] text-cam-text-muted">
                      Duration: {event.duration}ms
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-cam-text-muted font-mono shrink-0">
          {formatTimestamp(event.timestamp)}
        </span>
      </div>
    </div>
  );
}
