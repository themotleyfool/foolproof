import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScanChannel } from './components/tabs/scan-channel';
import { LookupThread } from './components/tabs/lookup-thread';
import { KnowledgeBasePanel } from './components/tabs/knowledge-base-panel';
import { fetchStats } from './lib/api';

type Tab = 'scan' | 'lookup' | 'kb';

const TABS: { id: Tab; label: string }[] = [
  { id: 'scan',   label: 'Build Knowledge' },
  { id: 'lookup', label: 'Find Answer'     },
  { id: 'kb',     label: 'Browse'          },
];

/**
 * Root application component. Renders the header, tab navigation, and the active tab panel.
 * Fetches and displays aggregate knowledge base stats (entry count, channel count) in the header.
 */
function App() {
  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const { data: stats = { entriesCount: 0, channelsCount: 0 } } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-content-100 h-[60px] shrink-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo-jester-hat.svg"
            alt="Motley Fool"
            className="h-7 block shrink-0"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div className="flex items-baseline">
            <span className="text-base font-bold text-white tracking-tight">Fool</span>
            <span className="text-base font-black text-primary-24 tracking-tight">Proof</span>
          </div>
        </div>
        <div className="flex items-center gap-[7px] bg-white/6 border border-white/10 rounded-full px-[14px] py-[5px] shrink-0">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="0.5" y="0.5" width="4" height="4" rx="0.5" stroke="#9DA0B2" strokeWidth="1"/>
            <rect x="6.5" y="0.5" width="4" height="4" rx="0.5" stroke="#9DA0B2" strokeWidth="1"/>
            <rect x="0.5" y="6.5" width="4" height="4" rx="0.5" stroke="#9DA0B2" strokeWidth="1"/>
            <rect x="6.5" y="6.5" width="4" height="4" rx="0.5" stroke="#9DA0B2" strokeWidth="1"/>
          </svg>
          <span className="text-xs font-medium text-content-50">
            <strong className="text-content-24">{stats.entriesCount}</strong>
            {' '}entr{stats.entriesCount === 1 ? 'y' : 'ies'}
          </span>
          <span className="w-[3px] h-[3px] rounded-full bg-content-70 shrink-0 block" />
          <span className="text-xs font-medium text-content-50">
            <strong className="text-content-24">{stats.channelsCount}</strong>
            {' '}{stats.channelsCount === 1 ? 'channel' : 'channels'}
          </span>
        </div>
      </header>

      <nav className="bg-white border-b border-divider px-6 flex shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`h-[52px] px-[22px] border-0 border-b-2 bg-transparent text-sm cursor-pointer -mb-px whitespace-nowrap outline-none transition-colors duration-[120ms] ${
              activeTab === tab.id
                ? 'font-bold text-primary-100 border-primary-100'
                : 'font-semibold text-fg-muted border-transparent hover:bg-primary-8 hover:text-fg-strong'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 py-7 px-6">
        <div className="max-w-[860px] mx-auto w-full">
          {activeTab === 'scan'   && <ScanChannel />}
          {activeTab === 'lookup' && <LookupThread />}
          {activeTab === 'kb'     && <KnowledgeBasePanel />}
        </div>
      </main>
    </div>
  );
}

export default App;
