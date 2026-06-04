import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import channelList from '../../../lib/data/slack-channels.json';
import { scanChannel } from '../../lib/api';
import type { ScanRequest, ScanResponse } from '../../types';
import { ProgressStepper, StatusBanner } from '../ui';
import type { ComboboxOption } from '../ui/input';
import { ComboboxInput } from '../ui/input';

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

/**
 * Returns yesterday's date as an ISO 8601 date string (YYYY-MM-DD).
 * @returns Yesterday's date in YYYY-MM-DD format.
 */
function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
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
export function BuildKnowledgePage() {
  const [channelId, setChannelId] = useState('');
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState(yesterday());
  const [endDate, setEndDate] = useState(today());
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
    if (endDate) body.endDate = endDate;
    scanMutation.mutate(body);
  }

  const scanning = phase === 'scanning';

  const inputCls = 'w-full border border-border-subtle rounded-[4px] py-[9px] px-3 text-sm font-medium text-fg-strong bg-white outline-none transition-[border-color,box-shadow] duration-[120ms] focus:border-primary-100 focus:[box-shadow:0_0_0_3px_#EBEDF9] placeholder:text-fg-faint disabled:bg-primary-4 disabled:opacity-65 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col gap-4">
      {/* Form card */}
      <div className="bg-white border border-divider rounded-[8px] shadow-card p-6">
        <div className="mb-5">
          <h3 className="text-lg font-black text-fg-strong m-0 mb-1">Scan channel</h3>
          <p className="text-sm text-fg-muted m-0 leading-[1.6]">
            Fetch threads from a Slack channel and extract problem/solution pairs into the knowledge base using Claude AI.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end mb-5">
            <div className="flex-1">
              <label className="block text-[13px] font-bold text-fg-strong mb-[6px]">Channel</label>
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
            <div className="flex gap-3">
              <div className="flex-1 sm:flex-none">
                <label className="block text-[13px] font-bold text-fg-strong mb-[6px]">Start date</label>
                <input
                  className={`${inputCls} w-full sm:w-auto`}
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  disabled={scanning}
                />
              </div>
              <div className="flex-1 sm:flex-none">
                <label className="block text-[13px] font-bold text-fg-strong mb-[6px]">End date</label>
                <input
                  className={`${inputCls} w-full sm:w-auto`}
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  disabled={scanning}
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="h-10 px-5 rounded-[8px] border-0 text-sm font-bold text-white cursor-pointer inline-flex items-center gap-[7px] outline-none transition-colors duration-[120ms] bg-primary-100 hover:bg-primary-120 disabled:bg-primary-24 disabled:cursor-not-allowed"
            disabled={scanning || !channelId.trim()}
          >
            {scanning ? (
              <>
                <div className="w-[14px] h-[14px] rounded-full border-2 border-primary-16 border-t-primary-100 [animation:spin_0.7s_linear_infinite]" />
                Scanning…
              </>
            ) : 'Scan channel'}
          </button>
        </form>
      </div>

      {/* Progress card */}
      {(scanning || phase === 'done') && (
        <div className="bg-white border border-divider rounded-[8px] shadow-card p-6 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-5">
            {scanning ? (
              <div className="w-4 h-4 rounded-full border-2 border-primary-16 border-t-primary-100 [animation:spin_0.7s_linear_infinite]" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#43B02A"/>
                <path d="M5 8l2.2 2.2L11 5.8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span className={`text-[13px] font-bold uppercase tracking-[0.07em] ${scanning ? 'text-fg-default' : 'text-green-80'}`}>
              {scanning ? 'In progress' : 'Scan complete'}
            </span>
          </div>
          <ProgressStepper steps={SCAN_STEPS} currentStep={currentStep} />
        </div>
      )}

      {/* Results card */}
      {phase === 'done' && result && (
        <div className="bg-green-4 border border-[rgba(67,176,42,0.22)] rounded-[8px] shadow-card p-6 animate-fade-in-up">
          <p className="text-sm font-bold text-green-80 m-0 mb-4 flex items-center gap-[6px]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" fill="#43B02A"/>
              <path d="M4.2 7l2.2 2.2L9.8 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            #{result.channelName} scanned successfully
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px]">
            {[
              { label: 'Threads scanned', value: result.threadsScanned, accent: false },
              { label: 'Entries added',   value: result.entriesAdded,   accent: true  },
              { label: 'Skipped',         value: result.entriesSkipped, accent: false },
              { label: 'Duration',        value: `${(result.durationMs / 1000).toFixed(1)}s`, accent: false },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-[8px] border border-[rgba(67,176,42,0.2)] px-[14px] py-3">
                <div className={`text-[26px] font-black leading-[1.1] ${stat.accent ? 'text-green-80' : 'text-fg-strong'}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-fg-muted mt-[3px] leading-[1.4]">
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
