import { ConfidenceMeter, NeedsReviewBadge, TagChip, VerifiedBadge } from './ui';
import { formatDate, slackLink } from '../utils/format';
import type { KnowledgeEntry } from '../types';

/**
 * An icon-only anchor that opens a Slack permalink in a new tab.
 * @param href - The Slack deep link URL to navigate to.
 */
function SlackLinkIcon({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in Slack"
      onClick={e => e.stopPropagation()}
      className="inline-flex items-center justify-center text-content-36 shrink-0 leading-none no-underline opacity-60 transition-[opacity,color] duration-[120ms] hover:opacity-100 hover:text-[#4A154B]"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 1h3m0 0v3m0-3L5.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
  );
}

interface EntryCardProps {
  entry: KnowledgeEntry;
  /** Fades and scales the card out while a delete is in progress. */
  deleting?: boolean;
  /** Makes the card clickable; used to open a detail modal. */
  onClick?: () => void;
  /** Renders an edit button; called with the entry when clicked. */
  onEdit?: (entry: KnowledgeEntry) => void;
  /** Renders a delete button; called with the entry when clicked. */
  onDelete?: (entry: KnowledgeEntry) => void;
  /** Tag value to highlight as active. */
  activeTag?: string;
  /** Makes tags interactive; called with the tag string when clicked. */
  onTagClick?: (tag: string) => void;
  /** When provided, shows the scan date and a Slack deep link in the footer. */
  workspaceUrl?: string;
  /** Clamps the solution text to 2 lines. Useful when a detail modal is available. */
  clampSolution?: boolean;
}

/**
 * Reusable card for displaying a single knowledge base entry.
 * Renders problem, solution, tags, verification status, and optional action buttons.
 * @param entry - The knowledge base entry to display.
 * @param deleting - Whether the card is being deleted (applies fade/scale animation).
 * @param onClick - Optional click handler; makes the card interactive.
 * @param onEdit - Optional edit callback; renders an edit button when provided.
 * @param onDelete - Optional delete callback; renders a delete button when provided.
 * @param activeTag - Tag to highlight as active in the tag list.
 * @param onTagClick - Optional callback for tag clicks; makes tags interactive.
 * @param workspaceUrl - When provided, shows the scan date and a Slack link.
 * @param clampSolution - Whether to clamp solution text to 2 lines.
 */
export function EntryCard({
  entry,
  deleting,
  onClick,
  onEdit,
  onDelete,
  activeTag,
  onTagClick,
  workspaceUrl,
  clampSolution,
}: EntryCardProps) {
  const hasActions = onEdit != null || onDelete != null;

  return (
    <div
      className="group relative bg-white border border-divider rounded-[8px] px-4 py-[14px] transition-shadow duration-[120ms] hover:shadow-card animate-fade-in-up"
      onClick={onClick}
      style={{
        opacity: deleting ? 0 : 1,
        transform: deleting ? 'scale(0.98)' : 'scale(1)',
        transition: 'opacity 0.25s, transform 0.25s',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      {hasActions && (
        <div className="absolute top-3 right-3 flex gap-1">
          {onEdit && (
            <button
              className="w-6 h-6 border-0 bg-transparent text-content-24 cursor-pointer flex items-center justify-center rounded-[4px] transition-all duration-[120ms] opacity-0 group-hover:opacity-100 shrink-0 hover:bg-primary-8 hover:text-primary-100"
              onClick={e => { e.stopPropagation(); onEdit(entry); }}
              title="Edit & verify solution"
            >
              <svg width="9" height="9" viewBox="0 0 11 11" fill="none">
                <path d="M7.5 1.5L9.5 3.5L3.5 9.5H1.5V7.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              className="w-6 h-6 border-0 bg-transparent text-content-24 cursor-pointer flex items-center justify-center rounded-[4px] transition-all duration-[120ms] opacity-0 group-hover:opacity-100 shrink-0 hover:bg-red-4 hover:text-red-50"
              onClick={e => { e.stopPropagation(); onDelete(entry); }}
              title="Delete entry"
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      )}

      <p
        className="text-sm font-bold text-fg-strong leading-[1.4] mt-0 mb-[6px]"
        style={{ marginRight: hasActions ? 48 : 0 }}
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
              {formatDate(entry.scannedAt)}
            </span>
            <SlackLinkIcon href={slackLink(workspaceUrl, entry.channelId, entry.threadTs)} />
          </>
        )}
      </div>
    </div>
  );
}
