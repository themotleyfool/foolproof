import { useEffect, useRef, useState } from 'react';
import { ConfidenceMeter, NeedsReviewBadge, SlackLinkIcon, TagChip, VerifiedBadge } from './ui';
import { formatSlackTs, slackLink } from '../utils/format';
import type { KnowledgeEntry } from '../types';

interface EntryCardProps {
  entry: KnowledgeEntry;
  /** Fades and scales the card out while a delete is in progress. */
  deleting?: boolean;
  /** Makes the card clickable; used to open a detail modal. */
  onClick?: () => void;
  /** Renders an edit item in the actions menu; called with the entry when clicked. */
  onEdit?: (entry: KnowledgeEntry) => void;
  /** Renders a delete item in the actions menu; called with the entry when clicked. */
  onDelete?: (entry: KnowledgeEntry) => void;
  /** Renders a refresh item in the actions menu that re-fetches the thread and re-extracts knowledge. */
  onRefresh?: (entry: KnowledgeEntry) => void;
  /** Shows a spinner on the refresh menu item while a refresh is in progress. */
  refreshing?: boolean;
  /** Tag value to highlight as active. */
  activeTag?: string;
  /** Makes tags interactive; called with the tag string when clicked. */
  onTagClick?: (tag: string) => void;
  /** When provided, shows the original thread date and a Slack deep link in the footer. */
  workspaceUrl?: string;
  /** Clamps the solution text to 2 lines. Useful when a detail modal is available. */
  clampSolution?: boolean;
}

/**
 * Reusable card for displaying a single knowledge base entry.
 * Renders problem, solution, tags, verification status, and an actions menu (⋮).
 * @param entry - The knowledge base entry to display.
 * @param deleting - Whether the card is being deleted (applies fade/scale animation).
 * @param onClick - Optional click handler; makes the card interactive.
 * @param onEdit - Optional edit callback; adds an edit item to the actions menu when provided.
 * @param onDelete - Optional delete callback; adds a delete item to the actions menu when provided.
 * @param onRefresh - Optional refresh callback; adds a refresh item to the actions menu when provided.
 * @param refreshing - Whether a refresh is in progress (shows spinner on the refresh menu item).
 * @param activeTag - Tag to highlight as active in the tag list.
 * @param onTagClick - Optional callback for tag clicks; makes tags interactive.
 * @param workspaceUrl - When provided, shows the original thread date and a Slack link.
 * @param clampSolution - Whether to clamp solution text to 2 lines.
 */
export function EntryCard({
  entry,
  deleting,
  onClick,
  onEdit,
  onDelete,
  onRefresh,
  refreshing,
  activeTag,
  onTagClick,
  workspaceUrl,
  clampSolution,
}: EntryCardProps) {
  const hasActions = onEdit != null || onDelete != null || onRefresh != null;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [menuOpen]);

  return (
    <div
      className="relative overflow-hidden bg-white border border-divider rounded-[8px] px-4 py-[14px] transition-shadow duration-[120ms] hover:shadow-card animate-fade-in-up"
      onClick={onClick}
      style={{
        opacity: deleting ? 0 : 1,
        transform: deleting ? 'scale(0.98)' : 'scale(1)',
        transition: 'opacity 0.25s, transform 0.25s',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      {refreshing && (
        <div className="absolute inset-0 z-20 bg-white/80 flex items-center justify-center">
          <svg className="animate-spin text-primary-100" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2"/>
            <path d="M11 2a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}

      {hasActions && (
        <div ref={menuRef} className="absolute top-3 right-3">
          <button
            className="w-6 h-6 border-0 bg-transparent text-content-36 cursor-pointer flex items-center justify-center rounded-[4px] transition-all duration-[120ms] shrink-0 hover:bg-primary-8 hover:text-primary-100"
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
            title="Actions"
          >
            <svg width="3" height="13" viewBox="0 0 3 13" fill="currentColor">
              <circle cx="1.5" cy="1.5" r="1.5"/>
              <circle cx="1.5" cy="6.5" r="1.5"/>
              <circle cx="1.5" cy="11.5" r="1.5"/>
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-divider rounded-[8px] shadow-card min-w-[168px] py-1 overflow-hidden">
              {onRefresh && (
                <button
                  className="w-full px-3 py-[7px] border-0 bg-transparent text-[13px] text-fg-default font-medium text-left flex items-center gap-[9px] cursor-pointer transition-colors duration-[120ms] hover:bg-primary-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); if (!refreshing) onRefresh(entry); }}
                  disabled={refreshing}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={refreshing ? 'animate-spin' : ''}>
                    <path d="M10.5 2v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.5 5A4.5 4.5 0 1 1 6.5 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  {refreshing ? 'Refreshing…' : 'Refresh from Slack'}
                </button>
              )}
              {onEdit && (
                <button
                  className="w-full px-3 py-[7px] border-0 bg-transparent text-[13px] text-fg-default font-medium text-left flex items-center gap-[9px] cursor-pointer transition-colors duration-[120ms] hover:bg-primary-4"
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onEdit(entry); }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M7.5 1.5L9.5 3.5L3.5 9.5H1.5V7.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  </svg>
                  Edit & verify
                </button>
              )}
              {onDelete && (
                <>
                  {(onRefresh || onEdit) && <div className="mx-2 my-1 border-t border-divider" />}
                  <button
                    className="w-full px-3 py-[7px] border-0 bg-transparent text-[13px] text-red-50 font-medium text-left flex items-center gap-[9px] cursor-pointer transition-colors duration-[120ms] hover:bg-red-4"
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(entry); }}
                  >
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <p
        className="text-sm font-bold text-fg-strong leading-[1.4] mt-0 mb-[6px] line-clamp-3"
        style={{ marginRight: hasActions ? 32 : 0 }}
      >
        {entry.problem}
      </p>

      <p
        className={`text-[13px] text-fg-default mt-0 mb-[10px] leading-[1.6] ${clampSolution ? 'line-clamp-2' : ''}`}
      >
        {entry.solution}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {entry.tags.length > 0 && (
          <div
            className="flex gap-1 flex-wrap flex-1"
            onClick={onTagClick ? e => e.stopPropagation() : undefined}
          >
            {entry.tags.map(t => (
              <TagChip key={t} label={t} active={t === activeTag} onClick={onTagClick ? () => onTagClick(t) : undefined} />
            ))}
          </div>
        )}
        {!entry.verification && <ConfidenceMeter level={entry.confidence} />}
        {entry.verification
          ? <VerifiedBadge verifiedBy={entry.verification.verifiedBy} verifiedAt={entry.verification.verifiedAt} />
          : <NeedsReviewBadge />
        }
        {workspaceUrl && (
          <>
            <span className="text-[11px] text-content-36 font-medium whitespace-nowrap">
              {formatSlackTs(entry.threadTs)}
            </span>
            <SlackLinkIcon href={slackLink(workspaceUrl, entry.channelId, entry.threadTs)} />
          </>
        )}
      </div>
    </div>
  );
}
