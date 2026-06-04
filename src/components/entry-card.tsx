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
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#9DA0B2', flexShrink: 0, lineHeight: 1, textDecoration: 'none' }}
      className="slack-link-icon"
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
      className="entry-card animate-in"
      onClick={onClick}
      style={{
        opacity: deleting ? 0 : 1,
        transform: deleting ? 'scale(0.98)' : 'scale(1)',
        transition: 'opacity 0.25s, transform 0.25s',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      {hasActions && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
          {onEdit && (
            <button
              className="entry-action-btn"
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
              className="entry-action-btn entry-action-btn--delete"
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

      <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: `0 ${hasActions ? 48 : 0}px 6px 0`, lineHeight: 1.4 }}>
        {entry.problem}
      </p>

      <p style={{
        fontSize: 13,
        color: '#515151',
        margin: '0 0 10px',
        lineHeight: 1.6,
        ...(clampSolution ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' } : {}),
      }}>
        {entry.solution}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {entry.tags.length > 0 && (
          <div
            style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}
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
            <span style={{ fontSize: 11, color: '#9DA0B2', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {formatDate(entry.scannedAt)}
            </span>
            <SlackLinkIcon href={slackLink(workspaceUrl, entry.channelId, entry.threadTs)} />
          </>
        )}
      </div>
    </div>
  );
}
