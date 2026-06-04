import { useState } from 'react';
import { useApi } from '../hooks/use-api';
import { StatusMessage } from './status-message';
import type { LookupRequest, LookupResponse, KnowledgeEntry } from '../types';

const confidenceClasses: Record<KnowledgeEntry['confidence'], string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-red-100 text-red-800',
};

export function LookupThread() {
  const [url, setUrl] = useState('');
  const { execute, data, loading, error } = useApi<LookupResponse, LookupRequest>('/api/lookup');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    await execute({ slackUrl: url.trim() });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Look Up Thread</h2>
        <p className="text-sm text-gray-500 mt-1">
          Paste a Slack message permalink to get an AI-suggested solution based on the knowledge
          base.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slack message URL
          </label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://yourworkspace.slack.com/archives/C.../p..."
            className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {loading ? 'Looking up…' : 'Look Up'}
        </button>
      </form>

      {loading && (
        <StatusMessage type="info" message="Fetching thread and generating solution…" />
      )}
      {error && <StatusMessage type="error" message={error} />}

      {data && (
        <div className="space-y-4">
          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Thread
            </p>
            <p className="text-sm text-gray-800">{data.thread.parentMessage.text}</p>
            {data.thread.replies.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {data.thread.replies.length}{' '}
                {data.thread.replies.length === 1 ? 'reply' : 'replies'}
              </p>
            )}
          </div>

          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Suggested Solution
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{data.suggestedSolution}</p>
          </div>

          {data.relatedEntries.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Related Knowledge Base Entries
              </p>
              <div className="space-y-2">
                {data.relatedEntries.map(entry => (
                  <div key={entry.id} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{entry.problem}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${confidenceClasses[entry.confidence]}`}
                      >
                        {entry.confidence}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{entry.solution}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {entry.tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
