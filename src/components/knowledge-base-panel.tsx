import { useEffect, useRef, useState } from 'react';
import { StatusMessage } from './status-message';
import type { KnowledgeEntry } from '../types';

interface KbResponse {
  entries: KnowledgeEntry[];
  total: number;
}

const confidenceClasses: Record<KnowledgeEntry['confidence'], string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-red-100 text-red-800',
};

export function KnowledgeBasePanel() {
  const [channels, setChannels] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tag, setTag] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [tagOpen, setTagOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<KbResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tagRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await fetch('/api/knowledge');
        if (!res.ok) throw new Error('Failed to load channels');
        const json = (await res.json()) as { channels: string[] };
        setChannels(json.channels);
        if (json.channels.length > 0) setSelectedChannel(json.channels[0]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    }
    void loadChannels();
  }, []);

  useEffect(() => {
    if (!selectedChannel) return;
    setTag('');
    setTagSearch('');
    void fetchEntries(selectedChannel, '', query);
    void fetchAllTags(selectedChannel);
  }, [selectedChannel]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) {
        setTagOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchAllTags(channel: string) {
    try {
      const res = await fetch(`/api/knowledge/${channel}`);
      if (!res.ok) return;
      const json = (await res.json()) as KbResponse;
      const tags = [...new Set(json.entries.flatMap(e => e.tags))].sort();
      setAllTags(tags);
    } catch {
      // non-critical, tag dropdown just stays empty
    }
  }

  async function fetchEntries(channel: string, tg: string, q: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (tg) params.set('tag', tg);
      if (q) params.set('q', q);
      const qs = params.toString();
      const res = await fetch(`/api/knowledge/${channel}${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Failed to load entries');
      setData((await res.json()) as KbResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (selectedChannel) await fetchEntries(selectedChannel, tag, query);
  }

  function selectTag(t: string) {
    setTag(t);
    setTagSearch(t);
    setTagOpen(false);
  }

  function clearTag() {
    setTag('');
    setTagSearch('');
    setTagOpen(false);
  }

  const filteredTags = allTags.filter(t =>
    t.toLowerCase().includes(tagSearch.toLowerCase())
  );

  async function handleDelete(id: string) {
    await fetch(`/api/knowledge/${selectedChannel}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    await fetchEntries(selectedChannel, tag, query);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Knowledge Base</h2>
        <p className="text-sm text-gray-500 mt-1">
          Browse and search extracted problem/solution pairs by channel.
        </p>
      </div>

      {channels.length === 0 && !error && (
        <StatusMessage
          type="info"
          message="No knowledge bases yet. Scan a channel to get started."
        />
      )}

      {channels.length > 0 && (
        <>
          <div className="flex gap-2 flex-wrap">
            {channels.map(ch => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  selectedChannel === ch
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                #{ch}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
            <div ref={tagRef} className="relative">
              <div className="flex items-center border rounded bg-white focus-within:ring-2 focus-within:ring-blue-500">
                <input
                  type="text"
                  value={tagSearch}
                  onChange={e => {
                    setTagSearch(e.target.value);
                    setTag('');
                    setTagOpen(true);
                  }}
                  onFocus={() => setTagOpen(true)}
                  placeholder="Filter by tag"
                  className="px-3 py-2 text-sm outline-none bg-transparent w-36"
                />
                {tag && (
                  <button
                    type="button"
                    onClick={clearTag}
                    className="px-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label="Clear tag"
                  >
                    ✕
                  </button>
                )}
              </div>
              {tagOpen && filteredTags.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-y-auto text-sm">
                  {filteredTags.map(t => (
                    <li
                      key={t}
                      onMouseDown={() => selectTag(t)}
                      className={`px-3 py-1.5 cursor-pointer hover:bg-blue-50 ${
                        t === tag ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search problem / solution"
              className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white flex-1 min-w-48"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 cursor-pointer transition-colors"
            >
              Search
            </button>
          </form>
        </>
      )}

      {error && <StatusMessage type="error" message={error} />}
      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {data && (
        <>
          <p className="text-sm text-gray-500">
            {data.total} {data.total === 1 ? 'entry' : 'entries'} in #{selectedChannel}
          </p>
          {data.entries.length === 0 ? (
            <StatusMessage type="info" message="No entries match your filters." />
          ) : (
            <div className="space-y-3">
              {data.entries.map(entry => (
                <div key={entry.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-gray-900">{entry.problem}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceClasses[entry.confidence]}`}
                      >
                        {entry.confidence}
                      </span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer text-sm leading-none"
                        title="Delete entry"
                        aria-label="Delete entry"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{entry.solution}</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1 flex-wrap">
                      {entry.tags.map(t => (
                        <span
                          key={t}
                          className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(entry.scannedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
