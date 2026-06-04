import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { StatusBanner } from './shared';
import { EntryCard } from './entry-card';
import type { LookupRequest } from '../types';
import { lookupThread } from '../lib/api';

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Form card */}
      <div className="card card-pad">
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0A0A0A', margin: '0 0 4px' }}>Look up thread</h3>
          <p style={{ fontSize: 14, color: '#6F6F6F', margin: 0, lineHeight: 1.6 }}>
            Paste a Slack message permalink to get an AI-suggested solution based on the knowledge base.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Slack message URL</label>
            <input
              className="input"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://yourworkspace.slack.com/archives/C.../p..."
              disabled={loading}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading || !url.trim()}>
            {loading ? (
              <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Looking up…</>
            ) : 'Look up thread'}
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card card-pad animate-in" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="spinner" />
          <span style={{ fontSize: 14, color: '#515151' }}>Fetching thread and generating solution…</span>
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Section divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C2C4CF', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
              Results
            </span>
            <div style={{ flex: 1, height: 1, background: '#EBEBEF' }} />
          </div>

          {/* Thread context card */}
          <div className="card animate-in" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: '#F5F5F7', borderBottom: '1px solid #EBEBEF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1h10v8H7l-3 2V9H1V1z" stroke="#80849B" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#80849B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Thread context
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0522BA', background: '#EBEDF9', border: '1px solid #D7DCF4', borderRadius: 999, padding: '2px 10px' }}>
                #{data.thread.channelName}
              </span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ borderLeft: '3px solid #D7DCF4', paddingLeft: 12 }}>
                <p style={{ fontSize: 14, color: '#0A0A0A', margin: 0, lineHeight: 1.65 }}>
                  {data.thread.parentMessage.text}
                </p>
                {data.thread.parentMessage.userName && (
                  <span style={{ fontSize: 12, color: '#9DA0B2', fontWeight: 600, marginTop: 5, display: 'block' }}>
                    @{data.thread.parentMessage.userName}
                  </span>
                )}
              </div>
              {data.thread.replies.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, paddingTop: 10, borderTop: '1px solid #F5F5F7' }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M10 1H2a1 1 0 00-1 1v6a1 1 0 001 1h1v2l3-2h4a1 1 0 001-1V2a1 1 0 00-1-1z" stroke="#C2C4CF" strokeWidth="1.2" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: 12, color: '#9DA0B2', fontWeight: 600 }}>
                    {data.thread.replies.length} {data.thread.replies.length === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Suggested solution card */}
          <div className="card animate-in" style={{ overflow: 'hidden', border: '1px solid #C3CAEE' }}>
            <div style={{ padding: '12px 16px', background: '#F5F6FC', borderBottom: '1px solid #D7DCF4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1l1.2 3.6H11L8.4 6.8l1 3.2L6 8.2 2.6 10l1-3.2L1 4.6h3.8L6 1z" stroke="#0522BA" strokeWidth="1.1" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0522BA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Suggested solution
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-ghost"
                style={{ height: 28, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: copied ? '#178217' : '#80849B', padding: '0 8px', borderRadius: 4 }}
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
            <div style={{ display: 'flex' }}>
              <div style={{ width: 3, background: '#0522BA', flexShrink: 0 }} />
              <div style={{ padding: 16, flex: 1 }}>
                <p style={{ fontSize: 14, color: '#0A0A0A', margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>
                  {data.suggestedSolution}
                </p>
              </div>
            </div>
          </div>

          {/* Related entries accordion */}
          {data.relatedEntries.length > 0 && (
            <div className="card animate-in" style={{ overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setRelatedOpen(o => !o)}
                style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-sans)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="1" width="4" height="4" rx="0.5" stroke="#80849B" strokeWidth="1.2"/>
                    <rect x="7" y="1" width="4" height="4" rx="0.5" stroke="#80849B" strokeWidth="1.2"/>
                    <rect x="1" y="7" width="4" height="4" rx="0.5" stroke="#80849B" strokeWidth="1.2"/>
                    <rect x="7" y="7" width="4" height="4" rx="0.5" stroke="#80849B" strokeWidth="1.2"/>
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#80849B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Related entries
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#EBEDF9', color: '#0522BA', borderRadius: 99, padding: '1px 7px', marginLeft: 2 }}>
                    {data.relatedEntries.length}
                  </span>
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: relatedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#80849B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {relatedOpen && (
                <div style={{ borderTop: '1px solid #EBEBEF', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
