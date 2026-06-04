import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProgressStepper, StatusBanner } from './shared';
import type { ScanRequest, ScanResponse } from '../types';
import { ComboboxInput } from '../ui/input';
import type { ComboboxOption } from '../ui/input';
import channelList from '../../lib/data/slack-channels.json';
import { scanChannel } from '../lib/api';

interface SlackChannel {
  id: string;
  name: string;
}

/**
 * Returns today's date as an ISO 8601 date string (YYYY-MM-DD).
 * @returns Today's date in YYYY-MM-DD format.
 */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const SCAN_STEPS = [
  { label: 'Resolving channel and verifying access...' },
  { label: 'Fetching messages from Slack...' },
  { label: 'Analyzing threads with Claude AI...' },
  { label: 'Saving entries to knowledge base...' },
];

// Cumulative delays (ms) to reach steps 1, 2, 3 while API call runs
const STEP_DELAYS = [900, 2500, 5500];

const channelOptions: ComboboxOption[] = (channelList as SlackChannel[]).map(c => ({
  value: c.id,
  label: c.name,
  hint: c.id,
}));

/**
 * Tab panel for scanning a Slack channel and extracting knowledge base entries.
 * Displays a progress stepper during the scan and a results summary on completion.
 */
export function ScanChannel() {
  const [channelId, setChannelId] = useState('');
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  /**
   * Cancels all pending step-advance timers and clears the ref array.
   */
  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  const scanMutation = useMutation({
    mutationFn: (body: ScanRequest) => scanChannel(body),
    onSuccess: (data) => {
      clearTimers();
      setCurrentStep(SCAN_STEPS.length);
      setPhase('done');
      setResult(data);
      void queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (e) => {
      clearTimers();
      setErrorMsg(e instanceof Error ? e.message : 'Network error');
      setPhase('error');
      setCurrentStep(-1);
    },
  });

  /**
   * Handles form submission: starts the scan, advances the progress stepper
   * on a timer, and delegates to the scan mutation.
   * @param e - The form submit event.
   */
  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!channelId.trim() || scanMutation.isPending) return;

    setPhase('scanning');
    setCurrentStep(0);
    setResult(null);
    setErrorMsg('');
    clearTimers();

    timersRef.current = STEP_DELAYS.map((delay, i) =>
      setTimeout(() => setCurrentStep(i + 1), delay)
    );

    const body: ScanRequest = { channelId: channelId.trim() };
    if (startDate) body.startDate = startDate;
    scanMutation.mutate(body);
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
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Channel</label>
              <ComboboxInput
                id="channel"
                options={channelOptions}
                value={query}
                onChange={text => { setChannelId(''); setQuery(text); }}
                onSelect={option => { setChannelId(option.value); setQuery(option.label); }}
                prefix="#"
                debounceMs={500}
                placeholder="Search by channel name…"
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
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" fill="#43B02A"/>
              <path d="M4.2 7l2.2 2.2L9.8 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            #{result.channelName} scanned successfully
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Threads scanned', value: result.threadsScanned, accent: false },
              { label: 'Entries added',   value: result.entriesAdded,   accent: true  },
              { label: 'Skipped',         value: result.entriesSkipped, accent: false },
              { label: 'Duration',        value: `${(result.durationMs / 1000).toFixed(1)}s`, accent: false },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'white', borderRadius: 8, border: '1px solid rgba(67,176,42,0.2)', padding: '12px 14px' }}>
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

      {phase === 'error' && (
        <StatusBanner type="error" message={errorMsg || 'Scan failed. Please try again.'} />
      )}
    </div>
  );
}
