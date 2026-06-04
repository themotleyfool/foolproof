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
      className="inline-flex items-center justify-center text-content-36 shrink-0 leading-none no-underline opacity-60 transition-[opacity,color] duration-[120ms] hover:opacity-100 hover:text-[#4A154B]"
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
    <div className="fixed inset-0 bg-[rgba(2,10,56,0.45)] z-[100] flex items-center justify-center p-6 animate-fade-in-up" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-modal max-w-[680px] w-full p-0 max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-detail-title"
      >
        {/* Header */}
        <div className="px-5 py-[13px] border-b border-divider flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-100 bg-primary-8 border border-primary-16 rounded-full px-[10px] py-[2px]">
              #{entry.channelName}
            </span>
            {entry.verification ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold py-[2px] px-[7px] rounded-full border border-[#A3E4C1] bg-[#E6FAF0] text-[#1A7F4B] whitespace-nowrap tracking-[0.02em]" title={`Verified by ${entry.verification.verifiedBy}`}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                  <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold py-[2px] px-[7px] rounded-full border border-[#F5D48A] bg-[#FFF8E6] text-[#92620C] whitespace-nowrap tracking-[0.02em]">
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
            className="w-7 h-7 border-0 bg-transparent cursor-pointer flex items-center justify-center rounded-[6px] text-content-50 shrink-0 hover:bg-content-4 transition-colors duration-[120ms]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Problem */}
          <div className="mb-[18px]">
            <p className="text-[11px] font-bold text-content-36 uppercase tracking-[0.08em] m-0 mb-[7px]">
              Problem
            </p>
            <p id="entry-detail-title" className="text-[15px] font-bold text-fg-strong m-0 leading-[1.45]">
              {entry.problem}
            </p>
          </div>

          {/* Solution */}
          <div className="mb-5">
            <p className="text-[11px] font-bold text-content-36 uppercase tracking-[0.08em] m-0 mb-[7px]">
              Solution
            </p>
            <div className="flex">
              <div className="w-[3px] bg-primary-100 rounded-[2px] shrink-0" />
              <p className="text-sm text-fg-strong m-0 pl-[14px] leading-[1.75] whitespace-pre-wrap">
                {entry.solution}
              </p>
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-2 flex-wrap pb-[14px] mb-[14px] border-b border-divider">
            {!entry.verification && <ConfidenceMeter level={entry.confidence} />}
            {!entry.verification && <div className="w-px h-3 bg-divider shrink-0" />}
            <span className="text-xs text-content-36 font-medium">Scanned {date}</span>
            {entry.verification && (
              <>
                <div className="w-px h-3 bg-divider shrink-0" />
                <span className="text-xs text-content-36 font-medium">
                  Verified by <strong className="text-fg-default">{entry.verification.verifiedBy}</strong>
                  {' · '}{new Date(entry.verification.verifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </>
            )}
            {threadUrl && (
              <div className="ml-auto flex items-center">
                <SlackLinkIcon href={threadUrl} />
              </div>
            )}
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex gap-[5px] flex-wrap mb-5">
              {entry.tags.map(t => <TagChip key={t} label={t} />)}
            </div>
          )}

          {/* Thread messages */}
          {entry.rawMessages.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setMessagesOpen(o => !o)}
                className="w-full border-0 bg-transparent cursor-pointer py-[6px] px-0 flex items-center gap-[7px] mb-2"
              >
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  className={`shrink-0 transition-transform duration-200 ${messagesOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M1.5 3.5L5 7l3.5-3.5" stroke="#80849B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[11px] font-bold text-content-50 uppercase tracking-[0.08em]">
                  Thread messages
                </span>
                <span className="text-[11px] font-bold bg-primary-8 text-primary-100 rounded-full px-[7px] py-[1px]">
                  {entry.rawMessages.length}
                </span>
              </button>

              {messagesOpen && (
                <div className="bg-primary-4 rounded-[6px] overflow-hidden border border-primary-8">
                  {entry.rawMessages.map((msg, i) => (
                    <div
                      key={msg.ts}
                      className={`px-3 py-[9px] flex gap-[10px] items-start ${i < entry.rawMessages.length - 1 ? 'border-b border-primary-8' : ''}`}
                    >
                      <div className="w-[26px] h-[26px] rounded-full bg-primary-8 flex items-center justify-center shrink-0 text-[10px] font-bold text-content-50">
                        {(msg.userName ?? msg.user).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-[2px]">
                          <span className="text-xs font-bold text-[#373D5B]">{msg.userName ?? msg.user}</span>
                        </div>
                        <p className="text-[13px] text-fg-default m-0 leading-[1.55]">{msg.text}</p>
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
        <div className="px-5 py-[13px] border-t border-divider flex items-center justify-between shrink-0 gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="h-9 px-3 border-0 bg-transparent cursor-pointer inline-flex items-center gap-[6px] text-[13px] font-bold text-red-50 rounded-[6px] hover:bg-red-4 transition-colors duration-[120ms]"
          >
            <svg width="11" height="12" viewBox="0 0 11 12" fill="none">
              <path d="M1 3h9M3.5 3V1.5h4V3M2 3l.6 7.5h5.8L9 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="h-9 px-3 rounded-[8px] border border-primary-24 bg-white text-[13px] font-bold text-primary-100 cursor-pointer inline-flex items-center outline-none transition-colors duration-[120ms] hover:bg-primary-8"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="h-9 px-3 rounded-[8px] border-0 bg-primary-100 text-[13px] font-bold text-white cursor-pointer inline-flex items-center outline-none transition-colors duration-[120ms] hover:bg-primary-120"
              onClick={onEdit}
            >
              Edit &amp; Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
