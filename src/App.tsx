import { useState } from 'react';
import { ScanChannel } from './components/scan-channel';
import { LookupThread } from './components/lookup-thread';
import { KnowledgeBasePanel } from './components/knowledge-base-panel';

type Tab = 'scan' | 'lookup' | 'knowledge';

const tabs: { id: Tab; label: string }[] = [
  { id: 'scan', label: 'Scan Channel' },
  { id: 'lookup', label: 'Lookup Thread' },
  { id: 'knowledge', label: 'Knowledge Base' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('scan');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Slack AI Knowledge Extractor</h1>

        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div>
          {activeTab === 'scan' && <ScanChannel />}
          {activeTab === 'lookup' && <LookupThread />}
          {activeTab === 'knowledge' && <KnowledgeBasePanel />}
        </div>
      </div>
    </div>
  );
}

export default App;
