// App root — header, tab nav, content routing
const { useState } = React;

const TABS = [
  { id: 'scan',   label: 'Scan channel'   },
  { id: 'lookup', label: 'Look up thread' },
  { id: 'kb',     label: 'Knowledge base' },
];

function Header({ entriesCount, channelsCount }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <img src="assets/logo-jester-hat.svg" alt="Motley Fool" className="header-logo" style={{ filter: 'brightness(0) invert(1)' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
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
          <strong style={{ color: '#C2C4CF' }}>{entriesCount}</strong>
          {' '}entr{entriesCount === 1 ? 'y' : 'ies'}
        </span>
        <span className="header-stats-dot"></span>
        <span className="header-stats-text">
          <strong style={{ color: '#C2C4CF' }}>{channelsCount}</strong>
          {' '}{channelsCount === 1 ? 'channel' : 'channels'}
        </span>
      </div>
    </header>
  );
}

function TabNav({ activeTab, setActiveTab }) {
  return (
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
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [entries, setEntries]     = useState(window.MOCK_ENTRIES || []);

  const channels = [...new Set(entries.map(e => e.channelName))];

  function handleAddEntries(count) {
    // Simulate newly scanned entries being added (append stub entries for counter update)
    const now = new Date().toISOString();
    const stubs = Array.from({ length: Math.min(count, 3) }, (_, i) => ({
      id: `new-entry-${Date.now()}-${i}`,
      channelId: 'C_NEW', channelName: 'new-channel',
      threadTs: `${Date.now() + i}`, scannedAt: now,
      problem: `Newly scanned entry ${i + 1}`,
      solution: 'Solution extracted by Claude AI.',
      rawMessages: [], tags: ['new'], confidence: 'medium',
    }));
    setEntries(prev => [...prev, ...stubs]);
  }

  function handleDeleteEntry(id) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div className="app-shell">
      <Header entriesCount={entries.length} channelsCount={channels.length} />
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ flex: 1, padding: '28px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
          {activeTab === 'scan'   && <ScanChannel onAddEntries={handleAddEntries} />}
          {activeTab === 'lookup' && <LookupThread entries={entries} />}
          {activeTab === 'kb'     && <KnowledgeBasePanel entries={entries} onDeleteEntry={handleDeleteEntry} />}
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
