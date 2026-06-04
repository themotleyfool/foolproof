// LookupThread tab component
const { useState } = React;

function LookupThread({ entries }) {
  const [url, setUrl]               = useState('');
  const [phase, setPhase]           = useState('idle'); // idle | loading | done | error
  const [result, setResult]         = useState(null);
  const [copied, setCopied]         = useState(false);
  const [relatedOpen, setRelatedOpen] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim() || phase === 'loading') return;
    setPhase('loading');
    setResult(null);
    setRelatedOpen(false);

    setTimeout(() => {
      const relatedEntries = (window.MOCK_LOOKUP_RESULT.relatedEntryIds || [])
        .map(id => (entries || []).find(e => e.id === id))
        .filter(Boolean);
      setResult({ ...window.MOCK_LOOKUP_RESULT, relatedEntries });
      setPhase('done');
    }, 2200);
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.suggestedSolution);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const loading = phase === 'loading';

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
      {phase === 'done' && result && (
        <>
          {/* Thread summary */}
          <div className="card animate-in" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#F5F6FC', borderBottom: '1px solid #EBEBEF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1h10v8H7l-3 2V9H1V1z" stroke="#80849B" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#80849B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Thread · #{result.thread.channelName}
                </span>
              </div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 14, color: '#0A0A0A', margin: '0 0 8px', lineHeight: 1.6 }}>
                {result.thread.parentMessage.text}
              </p>
              {result.thread.replies.length > 0 && (
                <span style={{ fontSize: 12, color: '#9DA0B2', fontWeight: 500 }}>
                  {result.thread.replies.length} {result.thread.replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
          </div>

          {/* Suggested solution */}
          <div className="card animate-in" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#F5F6FC', borderBottom: '1px solid #EBEBEF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.2 3.6H11L8.4 6.8l1 3.2L6 8.2 2.6 10l1-3.2L1 4.6h3.8L6 1z" stroke="#0522BA" strokeWidth="1.1" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0522BA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Suggested solution
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="btn btn-ghost"
                style={{ height: 28, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: copied ? '#178217' : '#80849B', padding: '0 8px', borderRadius: 4 }}
                title="Copy solution to clipboard"
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#178217" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="4" y="1" width="7" height="8" rx="1" stroke="#80849B" strokeWidth="1.2"/><path d="M1 4v7h7" stroke="#80849B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: 14, color: '#0A0A0A', margin: 0, lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>
                {result.suggestedSolution}
              </p>
            </div>
          </div>

          {/* Related entries accordion */}
          {result.relatedEntries && result.relatedEntries.length > 0 && (
            <div className="card animate-in" style={{ overflow: 'hidden' }}>
              <button
                onClick={() => setRelatedOpen(o => !o)}
                style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-sans)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" rx="0.5" stroke="#80849B" strokeWidth="1.2"/><rect x="7" y="1" width="4" height="4" rx="0.5" stroke="#80849B" strokeWidth="1.2"/><rect x="1" y="7" width="4" height="4" rx="0.5" stroke="#80849B" strokeWidth="1.2"/><rect x="7" y="7" width="4" height="4" rx="0.5" stroke="#80849B" strokeWidth="1.2"/></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#80849B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Related entries
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#EBEDF9', color: '#0522BA', borderRadius: 99, padding: '1px 7px', marginLeft: 2 }}>
                    {result.relatedEntries.length}
                  </span>
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: relatedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#80849B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {relatedOpen && (
                <div style={{ borderTop: '1px solid #EBEBEF' }}>
                  {result.relatedEntries.map((entry, i) => (
                    <div key={entry.id} style={{ padding: '12px 16px', borderBottom: i < result.relatedEntries.length - 1 ? '1px solid #EBEBEF' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', margin: 0, lineHeight: 1.4 }}>{entry.problem}</p>
                        <ConfidenceMeter level={entry.confidence} />
                      </div>
                      <p style={{ fontSize: 13, color: '#515151', margin: '0 0 8px', lineHeight: 1.5 }}>{entry.solution}</p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {entry.tags.map(t => <TagChip key={t} label={t} />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {phase === 'error' && <StatusBanner type="error" message="Failed to look up thread. Check the URL and try again." />}
    </div>
  );
}

Object.assign(window, { LookupThread });
