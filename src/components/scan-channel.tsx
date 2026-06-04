import { useState } from 'react';
import { useApi } from '../hooks/use-api';
import { StatusMessage } from './status-message';
import type { ScanRequest, ScanResponse } from '../types';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ScanChannel() {
  const [channelId, setChannelId] = useState('');
  const [startDate, setStartDate] = useState(today());
  const { execute, data, loading, error } = useApi<ScanResponse, ScanRequest>('/api/scan');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!channelId.trim()) return;
    await execute({ channelId: channelId.trim(), startDate: startDate || undefined });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Scan Channel</h2>
        <p className="text-sm text-gray-500 mt-1">
          Fetch all threads from a public Slack channel and extract problem/solution pairs into the
          knowledge base.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel ID</label>
            <input
              type="text"
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
              placeholder="C12345678"
              className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loading}
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 -mt-2">
          To find the ID: right-click the channel name in the Slack sidebar, choose "Channel details" &rarr; "View channel details", then copy the ID at the bottom of the window.
        </p>

        <button
          type="submit"
          disabled={loading || !channelId.trim()}
          className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {loading ? 'Scanning…' : 'Scan Channel'}
        </button>
      </form>

      {loading && (
        <StatusMessage
          type="info"
          message="Scanning messages and extracting knowledge — this may take a few minutes."
        />
      )}
      {error && <StatusMessage type="error" message={error} />}

      {data && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-green-800">Scan complete for #{data.channelName}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Threads scanned', value: data.threadsScanned },
              { label: 'Entries added', value: data.entriesAdded },
              { label: 'Skipped', value: data.entriesSkipped },
              { label: 'Duration', value: `${(data.durationMs / 1000).toFixed(1)}s` },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded p-3 border border-green-100">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
