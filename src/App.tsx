import { useEffect, useState } from 'react';
import { ScanChannel } from './components/scan-channel';
import { LookupThread } from './components/lookup-thread';
import { KnowledgeBasePanel } from './components/knowledge-base-panel';

type Tab = 'scan' | 'lookup' | 'kb';

const TABS: { id: Tab; label: string }[] = [
  { id: 'scan',   label: 'Scan channel'   },
  { id: 'lookup', label: 'Look up thread' },
  { id: 'kb',     label: 'Knowledge base' },
];

interface HeaderStats {
  entriesCount: number;
  channelsCount: number;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [stats, setStats] = useState<HeaderStats>({ entriesCount: 0, channelsCount: 0 });
  const [statsKey, setStatsKey] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/knowledge');
        if (!res.ok) return;
        const { channels } = await res.json() as { channels: string[] };
        if (channels.length === 0) {
          setStats({ entriesCount: 0, channelsCount: 0 });
          return;
        }
        const totals = await Promise.all(
          channels.map(ch =>
            fetch(`/api/knowledge/${ch}`)
              .then(r => r.json())
              .then((d: { total: number }) => d.total)
              .catch(() => 0)
          )
        );
        setStats({
          channelsCount: channels.length,
          entriesCount: totals.reduce((a, b) => a + b, 0),
        });
      } catch {
        // header stats are non-critical
      }
    }
    void loadStats();
  }, [statsKey]);

  function refreshStats() {
    setStatsKey(k => k + 1);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <img
            src="/assets/logo-jester-hat.svg"
            alt="Motley Fool"
            className="header-logo"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span className="header-title-main">Slack AI</span>
            <span className="header-title-sep">·</span>
            <span className="header-title-sub">Knowledge Extractor</span>
          </div>
        </div>
        <div className="header-stats">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="0.5" y="0.5" width="4" height="4" rx="0.5" stroke="#9DA0B2" strokeWidth="1"/>
            <rect x="6.5" y="0.5" width="4" height="4" rx="0.5" stroke="#9DA0B2" strokeWidth="1"/>
            <rect x="0.5" y="6.5" width="4" height="4" rx="0.5" stroke="#9DA0B2" strokeWidth="1"/>
            <rect x="6.5" y="6.5" width="4" height="4" rx="0.5" stroke="#9DA0B2" strokeWidth="1"/>
          </svg>
          <span className="header-stats-text">
            <strong style={{ color: '#C2C4CF' }}>{stats.entriesCount}</strong>
            {' '}entr{stats.entriesCount === 1 ? 'y' : 'ies'}
          </span>
          <span className="header-stats-dot" />
          <span className="header-stats-text">
            <strong style={{ color: '#C2C4CF' }}>{stats.channelsCount}</strong>
            {' '}{stats.channelsCount === 1 ? 'channel' : 'channels'}
          </span>
        </div>
      </header>

      <nav className="tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={'tab-btn' + (activeTab === tab.id ? ' active' : '')}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={{ flex: 1, padding: '28px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
          {activeTab === 'scan'   && <ScanChannel onScanComplete={refreshStats} />}
          {activeTab === 'lookup' && <LookupThread />}
          {activeTab === 'kb'     && <KnowledgeBasePanel onDelete={refreshStats} />}
        </div>
      </main>
    </div>
  );
}

export default App;
