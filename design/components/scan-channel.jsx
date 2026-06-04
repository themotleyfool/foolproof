// ScanChannel tab component
const { useState } = React;

const SCAN_STEPS = [
  { label: 'Resolving channel and verifying access...' },
  { label: 'Fetching messages from Slack...' },
  { label: 'Analyzing threads with Claude AI...' },
  { label: 'Saving entries to knowledge base...' },
];

const STEP_DELAYS = [900, 1600, 3000, 700];

function ScanChannel({ onAddEntries }) {
  const [channelId, setChannelId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [phase, setPhase] = useState('idle'); // idle | scanning | done | error
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!channelId.trim() || phase === 'scanning') return;
    setPhase('scanning');
    setCurrentStep(0);
    setResult(null);

    const startMs = Date.now();
    let step = 0;

    function advance() {
      setTimeout(() => {
        step++;
        if (step < SCAN_STEPS.length) {
          setCurrentStep(step);
          advance();
        } else {
          setTimeout(() => {
            const elapsed = Date.now() - startMs;
            const newResult = {
              channelName: channelId.trim(),
              threadsScanned: 47,
              entriesAdded: 23,
              entriesSkipped: 24,
              durationMs: elapsed,
            };
            setCurrentStep(SCAN_STEPS.length);
            setPhase('done');
            setResult(newResult);
            if (onAddEntries) onAddEntries(newResult.entriesAdded);
          }, 400);
        }
      }, STEP_DELAYS[step]);
    }
    advance();
  }

  const scanning = phase === 'scanning';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Form card */}
      <div className="card card-pad">
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0A0A0A', margin: '0 0 4px' }}>Scan channel</h3>
          <p style={{ fontSize: 14, color: '#6F6F6F', margin: 0, lineHeight: 1.6 }}>
            Fetch threads from a Slack channel and extract problem/solution pairs into the knowledge base using Claude AI.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Channel ID</label>
              <input
                className="input"
                type="text"
                value={channelId}
                onChange={e => setChannelId(e.target.value)}
                placeholder="C12345678"
                disabled={scanning}
              />
            </div>
            <div>
              <label className="label">Start date</label>
              <input
                className="input"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                disabled={scanning}
                style={{ width: 'auto' }}
              />
            </div>
          </div>
          <p className="helper-text" style={{ marginBottom: 20 }}>
            Find the channel ID in Slack: right-click the channel name → Channel details → copy the ID at the bottom.
          </p>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={scanning || !channelId.trim()}
          >
            {scanning ? (
              <>
                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Scanning…
              </>
            ) : 'Scan channel'}
          </button>
        </form>
      </div>

      {/* Progress card */}
      {(scanning || phase === 'done') && (
        <div className="card card-pad animate-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            {scanning ? (
              <div className="spinner" style={{ width: 16, height: 16 }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#43B02A"/>
                <path d="M5 8l2.2 2.2L11 5.8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: scanning ? '#515151' : '#178217', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {scanning ? 'In progress' : 'Scan complete'}
            </span>
          </div>
          <ProgressStepper steps={SCAN_STEPS} currentStep={currentStep} />
        </div>
      )}

      {/* Results card */}
      {phase === 'done' && result && (
        <div className="card card-pad animate-in" style={{ background: '#EEF7EE', borderColor: 'rgba(67,176,42,0.22)' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#178217', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" fill="#43B02A"/><path d="M4.2 7l2.2 2.2L9.8 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            #{result.channelName} scanned successfully
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Threads scanned', value: result.threadsScanned, accent: false },
              { label: 'Entries added',   value: result.entriesAdded,   accent: true  },
              { label: 'Skipped',         value: result.entriesSkipped, accent: false },
              { label: 'Duration',        value: `${(result.durationMs / 1000).toFixed(1)}s`, accent: false },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'white', borderRadius: 8,
                border: '1px solid rgba(67,176,42,0.2)', padding: '12px 14px',
              }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: stat.accent ? '#178217' : '#0A0A0A', lineHeight: 1.1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: '#6F6F6F', marginTop: 3, lineHeight: 1.4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

Object.assign(window, { ScanChannel });
