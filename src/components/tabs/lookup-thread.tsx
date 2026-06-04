import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { StatusBanner } from '../ui';
import { EntryCard } from '../entry-card';
import type { LookupRequest } from '../../types';
import { lookupThread } from '../../lib/api';

/**
 * Tab panel for looking up a Slack thread by permalink and getting an AI-suggested solution.
 * Displays the thread summary, suggested solution, and related knowledge base entries.
 */
export function LookupThread() {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [relatedOpen, setRelatedOpen] = useState(false);

  const lookupMutation = useMutation({
    mutationFn: (body: LookupRequest) => lookupThread(body),
  });

  const { data, isPending: loading, error } = lookupMutation;

  /**
   * Handles form submission, submitting the Slack URL to the lookup API.
   * @param e - The form submit event.
   */
  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setRelatedOpen(false);
    lookupMutation.mutate({ slackUrl: url.trim() });
  }

  /**
   * Copies the suggested solution text to the clipboard and shows a brief confirmation.
   */
  async function handleCopy() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.suggestedSolution);
    } finally {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const inputCls = 'w-full border border-border-subtle rounded-[4px] py-[9px] px-3 text-sm font-medium text-fg-strong bg-white outline-none transition-[border-color,box-shadow] duration-[120ms] focus:border-primary-100 focus:[box-shadow:0_0_0_3px_#EBEDF9] placeholder:text-fg-faint disabled:bg-primary-4 disabled:opacity-65 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col gap-4">
      {/* Form card */}
      <div className="bg-white border border-divider rounded-[8px] shadow-card p-6">
        <div className="mb-5">
          <h3 className="text-lg font-black text-fg-strong m-0 mb-1">Look up thread</h3>
          <p className="text-sm text-fg-muted m-0 leading-[1.6]">
            Paste a Slack message permalink to get an AI-suggested solution based on the knowledge base.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[13px] font-bold text-fg-strong mb-[6px]">Slack message URL</label>
            <input
              className={inputCls}
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://yourworkspace.slack.com/archives/C.../p..."
              disabled={loading}
            />
          </div>
          <button
            className="h-10 px-5 rounded-[8px] border-0 text-sm font-bold text-white cursor-pointer inline-flex items-center gap-[7px] outline-none transition-colors duration-[120ms] bg-primary-100 hover:bg-primary-120 disabled:bg-primary-24 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <>
                <div className="w-[14px] h-[14px] rounded-full border-2 border-primary-16 border-t-primary-100 [animation:spin_0.7s_linear_infinite]" />
                Looking up…
              </>
            ) : 'Look up thread'}
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white border border-divider rounded-[8px] shadow-card p-6 animate-fade-in-up flex items-center gap-3">
          <div className="w-[18px] h-[18px] rounded-full border-2 border-primary-16 border-t-primary-100 shrink-0 [animation:spin_0.7s_linear_infinite]" />
          <span className="text-sm text-fg-default">Fetching thread and generating solution…</span>
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Section divider */}
          <div className="flex items-center gap-[10px] py-[2px]">
            <span className="text-[11px] font-bold text-content-24 uppercase tracking-[0.1em] shrink-0">
              Results
            </span>
            <div className="flex-1 h-px bg-divider" />
          </div>

          {/* Thread context card */}
          <div className="bg-white border border-divider rounded-[8px] shadow-card animate-fade-in-up overflow-hidden">
            <div className="px-4 py-[10px] bg-content-4 border-b border-divider flex items-center justify-between">
              <div className="flex items-center gap-[6px]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1h10v8H7l-3 2V9H1V1z" stroke="#80849B" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                <span className="text-[11px] font-bold text-content-50 uppercase tracking-[0.08em]">
                  Thread context
                </span>
              </div>
              <span className="text-xs font-bold text-primary-100 bg-primary-8 border border-primary-16 rounded-full px-[10px] py-[2px]">
                #{data.thread.channelName}
              </span>
            </div>
            <div className="px-4 py-[14px]">
              <div className="border-l-[3px] border-border-subtle pl-3">
                <p className="text-sm text-fg-strong m-0 leading-[1.65]">
                  {data.thread.parentMessage.text}
                </p>
                {data.thread.parentMessage.userName && (
                  <span className="text-xs text-content-36 font-semibold mt-[5px] block">
                    @{data.thread.parentMessage.userName}
                  </span>
                )}
              </div>
              {data.thread.replies.length > 0 && (
                <div className="flex items-center gap-[5px] mt-[10px] pt-[10px] border-t border-content-4">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M10 1H2a1 1 0 00-1 1v6a1 1 0 001 1h1v2l3-2h4a1 1 0 001-1V2a1 1 0 00-1-1z" stroke="#C2C4CF" strokeWidth="1.2" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-xs text-content-36 font-semibold">
                    {data.thread.replies.length} {data.thread.replies.length === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Suggested solution card */}
          <div className="bg-white border border-primary-24 rounded-[8px] shadow-card animate-fade-in-up overflow-hidden">
            <div className="px-4 py-3 bg-primary-4 border-b border-primary-16 flex items-center justify-between">
              <div className="flex items-center gap-[6px]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1l1.2 3.6H11L8.4 6.8l1 3.2L6 8.2 2.6 10l1-3.2L1 4.6h3.8L6 1z" stroke="#0522BA" strokeWidth="1.1" strokeLinejoin="round"/>
                </svg>
                <span className="text-[11px] font-bold text-primary-100 uppercase tracking-[0.08em]">
                  Suggested solution
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={`h-7 px-2 rounded-[4px] border-0 bg-transparent text-xs cursor-pointer flex items-center gap-[5px] font-medium transition-colors duration-[120ms] ${copied ? 'text-green-80' : 'text-content-50 hover:bg-primary-4'}`}
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#178217" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="4" y="1" width="7" height="8" rx="1" stroke="#80849B" strokeWidth="1.2"/>
                      <path d="M1 4v7h7" stroke="#80849B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="flex">
              <div className="w-[3px] bg-primary-100 shrink-0" />
              <div className="p-4 flex-1">
                <p className="text-sm text-fg-strong m-0 leading-[1.8] whitespace-pre-wrap">
                  {data.suggestedSolution}
                </p>
              </div>
            </div>
          </div>

          {/* Related entries accordion */}
          {data.relatedEntries.length > 0 && (
            <div className="bg-white border border-divider rounded-[8px] shadow-card animate-fade-in-up overflow-hidden">
              <button
                type="button"
                onClick={() => setRelatedOpen(o => !o)}
                className="w-full px-4 py-3 bg-transparent border-0 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-[6px]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="1" width="4" height="4" rx="0.5" stroke="#80849B" strokeWidth="1.2"/>
                    <rect x="7" y="1" width="4" height="4" rx="0.5" stroke="#80849B" strokeWidth="1.2"/>
                    <rect x="1" y="7" width="4" height="4" rx="0.5" stroke="#80849B" strokeWidth="1.2"/>
                    <rect x="7" y="7" width="4" height="4" rx="0.5" stroke="#80849B" strokeWidth="1.2"/>
                  </svg>
                  <span className="text-[11px] font-bold text-content-50 uppercase tracking-[0.08em]">
                    Related entries
                  </span>
                  <span className="text-[11px] font-bold bg-primary-8 text-primary-100 rounded-full px-[7px] py-[1px] ml-[2px]">
                    {data.relatedEntries.length}
                  </span>
                </div>
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  className={`shrink-0 transition-transform duration-200 ${relatedOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#80849B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {relatedOpen && (
                <div className="border-t border-divider p-3 flex flex-col gap-2">
                  {data.relatedEntries.map(entry => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {error && <StatusBanner type="error" message="Failed to look up thread. Check the URL and try again." />}
    </div>
  );
}
