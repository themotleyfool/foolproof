import { useEffect, useState } from 'react';
import type { KnowledgeEntry } from '../../types';
import { slackLink } from '../../utils/format';
import { ConfidenceMeter, TagChip } from '../ui';

export interface EntryDetailModalProps {
  entry: KnowledgeEntry;
  workspaceUrl: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

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

/**
 * Full-detail modal for a knowledge base entry. Shows the problem, solution, metadata,
 * tags, and raw thread messages. Provides Edit & Verify and Delete actions.
 * @param entry - The knowledge entry to display.
 * @param workspaceUrl - Base Slack workspace URL for building deep links.
 * @param onClose - Called when the modal should be dismissed.
 * @param onEdit - Called when the user wants to edit and verify this entry.
 * @param onDelete - Called when the user wants to delete this entry.
 */
export function EntryDetailModal({ entry, workspaceUrl, onClose, onEdit, onDelete }: EntryDetailModalProps) {
  const [messagesOpen, setMessagesOpen] = useState(true);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const date = new Date(entry.scannedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const threadUrl = workspaceUrl ? slackLink(workspaceUrl, entry.channelId, entry.threadTs) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-detail-title"
        style={{ maxWidth: 680, padding: 0, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '13px 20px', borderBottom: '1px solid #EBEBEF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0522BA', background: '#EBEDF9', border: '1px solid #D7DCF4', borderRadius: 999, padding: '2px 10px' }}>
              #{entry.channelName}
            </span>
            {entry.verification ? (
              <span className="badge badge-verified" title={`Verified by ${entry.verification.verifiedBy}`}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                  <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Verified
              </span>
            ) : (
              <span className="badge badge-needs-review">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                  <circle cx="4.5" cy="4.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4.5 2.5v2.25l1.25 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Needs review
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: '#80849B', flexShrink: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Problem */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9DA0B2', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 7px' }}>
              Problem
            </p>
            <p id="entry-detail-title" style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0A', margin: 0, lineHeight: 1.45 }}>
              {entry.problem}
            </p>
          </div>

          {/* Solution */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9DA0B2', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 7px' }}>
              Solution
            </p>
            <div style={{ display: 'flex' }}>
              <div style={{ width: 3, background: '#0522BA', borderRadius: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 14, color: '#0A0A0A', margin: 0, paddingLeft: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>
                {entry.solution}
              </p>
            </div>
          </div>

          {/* Metadata row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #EBEBEF' }}>
            {!entry.verification && <ConfidenceMeter level={entry.confidence} />}
            {!entry.verification && <div style={{ width: 1, height: 12, background: '#EBEBEF', flexShrink: 0 }} />}
            <span style={{ fontSize: 12, color: '#9DA0B2', fontWeight: 500 }}>Scanned {date}</span>
            {entry.verification && (
              <>
                <div style={{ width: 1, height: 12, background: '#EBEBEF', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#9DA0B2', fontWeight: 500 }}>
                  Verified by <strong style={{ color: '#515151' }}>{entry.verification.verifiedBy}</strong>
                  {' · '}{new Date(entry.verification.verifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </>
            )}
            {threadUrl && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                <SlackLinkIcon href={threadUrl} />
              </div>
            )}
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 20 }}>
              {entry.tags.map(t => <TagChip key={t} label={t} />)}
            </div>
          )}

          {/* Thread messages */}
          {entry.rawMessages.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setMessagesOpen(o => !o)}
                style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-sans)', marginBottom: 8 }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: messagesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <path d="M1.5 3.5L5 7l3.5-3.5" stroke="#80849B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#80849B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Thread messages
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#EBEDF9', color: '#0522BA', borderRadius: 99, padding: '1px 7px' }}>
                  {entry.rawMessages.length}
                </span>
              </button>

              {messagesOpen && (
                <div style={{ background: '#F5F6FC', borderRadius: 6, overflow: 'hidden', border: '1px solid #EBEDF9' }}>
                  {entry.rawMessages.map((msg, i) => (
                    <div
                      key={msg.ts}
                      style={{ padding: '9px 12px', borderBottom: i < entry.rawMessages.length - 1 ? '1px solid #EBEDF9' : 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#EBEDF9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#80849B' }}>
                        {(msg.userName ?? msg.user).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#373D5B' }}>{msg.userName ?? msg.user}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#515151', margin: 0, lineHeight: 1.55 }}>{msg.text}</p>
                      </div>
                      {workspaceUrl && (
                        <SlackLinkIcon href={slackLink(workspaceUrl, entry.channelId, msg.ts, entry.threadTs)} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '13px 20px', borderTop: '1px solid #EBEBEF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 8 }}>
          <button
            type="button"
            onClick={onDelete}
            style={{ height: 36, padding: '0 12px', border: 'none', background: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#E31C28', fontFamily: 'var(--font-sans)', borderRadius: 6 }}
          >
            <svg width="11" height="12" viewBox="0 0 11 12" fill="none">
              <path d="M1 3h9M3.5 3V1.5h4V3M2 3l.6 7.5h5.8L9 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ height: 36, fontSize: 13 }} onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" style={{ height: 36, fontSize: 13 }} onClick={onEdit}>
              Edit &amp; Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
