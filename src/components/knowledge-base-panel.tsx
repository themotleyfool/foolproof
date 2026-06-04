import { useEffect, useMemo, useState } from 'react';
import type { KnowledgeEntry } from '../types';
import { ComboboxInput } from '../ui/input';
import { ConfirmModal } from './confirm-modal';
import { EntryCard } from './entry-card';
import { EntryDetailModal } from './entry-detail-modal';
import { EmptyState, SkeletonCard, StatusBanner } from './shared';
import { VerifyModal } from './verify-modal';

interface KbResponse {
  entries: KnowledgeEntry[];
  total: number;
}

/**
 * Tab panel for browsing, filtering, and deleting knowledge base entries across channels.
 * Supports filtering by channel, tag, and free-text search, and shows expandable raw messages.
 * @param onDelete - Optional callback invoked after an entry is successfully deleted.
 */
export function KnowledgeBasePanel({ onDelete }: { onDelete?: () => void }) {
  const [channels, setChannels] = useState<string[]>([]);
  const [channelSearch, setChannelSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tag, setTag] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<KbResponse | null>(null);
  const [viewingEntry, setViewingEntry] = useState<KnowledgeEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const workspaceUrl = import.meta.env.VITE_SLACK_WORKSPACE_URL as string ?? '';

  useEffect(() => {
    /**
     * Fetches the list of channels that have a knowledge base and selects the first one.
     */
    async function loadChannels() {
      try {
        const res = await fetch('/api/knowledge');
        if (!res.ok) throw new Error('Failed to load channels');
        const json = await res.json() as { channels: string[] };
        setChannels(json.channels);
        if (json.channels.length > 0) {
          setSelectedChannel(json.channels[0]);
        } else {
          setInitialLoading(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setInitialLoading(false);
      }
    }
    void loadChannels();
  }, []);

  useEffect(() => {
    if (!selectedChannel) return;
    void fetchEntries(selectedChannel, '', '');
    void fetchAllTags(selectedChannel);
  }, [selectedChannel]);



  /**
   * Fetches all unique tags from a channel's knowledge base for the tag filter dropdown.
   * @param channel - The channel name to load tags for.
   */
  async function fetchAllTags(channel: string) {
    try {
      const res = await fetch(`/api/knowledge/${channel}`);
      if (!res.ok) return;
      const json = await res.json() as KbResponse;
      const tags = [...new Set(json.entries.flatMap(e => e.tags))].sort();
      setAllTags(tags);
    } catch {
      // non-critical — tag filter just stays empty
    }
  }

  /**
   * Fetches knowledge base entries for a channel, applying optional tag and text filters.
   * @param channel - The channel name to load entries for.
   * @param tg - Tag filter value; pass an empty string to skip.
   * @param q - Text search query; pass an empty string to skip.
   */
  async function fetchEntries(channel: string, tg: string, q: string) {
    setTag(tg);
    setTagSearch(tg);
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (tg) params.set('tag', tg);
      if (q) params.set('q', q);
      const qs = params.toString();
      const res = await fetch(`/api/knowledge/${channel}${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Failed to load entries');
      setData(await res.json() as KbResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }

  /**
   * Handles search form submission, re-fetching entries with the current tag and query filters.
   * @param e - The form submit event.
   */
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (selectedChannel) await fetchEntries(selectedChannel, tag, query);
  }

  /**
   * Selects a tag from the dropdown, updating both the active filter and the input display value.
   * @param t - The tag string to select.
   */
  function selectTag(t: string) {
    setTag(t);
    setTagSearch(t);
  }

  /**
   * Clears the active tag filter and resets the tag search input.
   */
  function clearTag() {
    setTag('');
    setTagSearch('');
  }

  /**
   * Clears all active filters (tag and text query) and re-fetches the unfiltered entry list.
   */
  function handleClear() {
    clearTag();
    setQuery('');
    if (selectedChannel) void fetchEntries(selectedChannel, '', '');
  }

  /**
   * Animates an entry out, deletes it via the API, then refreshes the entry list.
   * Called after the user confirms the deletion in the confirm modal.
   */
  async function handleDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setDeletingId(id);
    await new Promise(res => setTimeout(res, 300));
    try {
      await fetch(`/api/knowledge/${selectedChannel}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setPendingDeleteId(null);
      setDeletingId(null);
      await fetchEntries(selectedChannel, tag, query);
      onDelete?.();
    } catch {
      setPendingDeleteId(null);
      setDeletingId(null);
    }
  }

  /**
   * Submits a problem/solution edit and verification stamp for an entry via PATCH, then refreshes.
   * @param id - The entry ID to patch.
   * @param problem - The updated problem text.
   * @param solution - The updated solution text.
   * @param verifierName - The admin's name to record on the verification.
   */
  async function handleVerify(id: string, problem: string, solution: string, verifierName: string) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/knowledge/${selectedChannel}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, solution, verifiedBy: verifierName }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setEditingEntry(null);
      await fetchEntries(selectedChannel, tag, query);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingId(null);
    }
  }

  const tagOptions = useMemo(
    () => allTags.map(t => ({ value: t, label: t })),
    [allTags]
  );
  const filteredChannels = useMemo(
    () => channels.filter(ch => ch.toLowerCase().includes(channelSearch.toLowerCase())),
    [channels, channelSearch]
  );
  const entries = data?.entries ?? [];

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 10h16M4 14h10" stroke="#C3CAEE" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          }
          title="No knowledge bases yet"
          description="Scan a Slack channel to start extracting problem/solution pairs."
        />
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Channel sidebar */}
        <div className="card" style={{ width: 200, flexShrink: 0, position: 'sticky', top: 28, alignSelf: 'flex-start', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '11px 14px', borderBottom: '1px solid #EBEBEF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9DA0B2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Channels
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#EBEDF9', color: '#0522BA', borderRadius: 99, padding: '1px 7px' }}>
              {channels.length}
            </span>
          </div>

          {/* Search */}
          <div style={{ padding: '7px 10px', borderBottom: '1px solid #EBEBEF', display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="5" cy="5" r="4" stroke="#C2C4CF" strokeWidth="1.3"/>
              <path d="M10 10L8 8" stroke="#C2C4CF" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              value={channelSearch}
              onChange={e => setChannelSearch(e.target.value)}
              placeholder="Search…"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0A0A0A', background: 'transparent', fontFamily: 'var(--font-sans)', minWidth: 0 }}
            />
            {channelSearch && (
              <button
                type="button"
                onClick={() => setChannelSearch('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#C2C4CF', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Channel list */}
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
            {filteredChannels.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9DA0B2', padding: '12px 14px', margin: 0 }}>No channels found</p>
            ) : filteredChannels.map(ch => (
              <button
                key={ch}
                className={'kb-channel-btn' + (selectedChannel === ch ? ' active' : '')}
                onClick={() => { setSelectedChannel(ch); setQuery(''); }}
              >
                <span className="kb-channel-hash" style={{ color: '#C2C4CF', fontWeight: 400, fontSize: 12, flexShrink: 0 }}>#</span>
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Filter card */}
          <div className="card card-pad">
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <ComboboxInput
                id="tag"
                options={tagOptions}
                value={tagSearch}
                onChange={text => { setTagSearch(text); setTag(''); }}
                onSelect={option => selectTag(option.value)}
                onClear={clearTag}
                placeholder="Filter by tag"
                style={{ width: 154 }}
              />
              <div style={{ flex: 1, minWidth: 180 }}>
                <input
                  className="input"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search problems and solutions"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Search</button>
              {(tag || query) && (
                <button type="button" className="btn btn-secondary" style={{ height: 40 }} onClick={handleClear}>
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* Results count */}
          {!loading && data && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, color: '#6F6F6F', margin: 0 }}>
                <strong style={{ color: '#0A0A0A' }}>{entries.length}</strong>{' '}
                {entries.length === 1 ? 'entry' : 'entries'}
                {selectedChannel && <> in <strong style={{ color: '#0A0A0A' }}>#{selectedChannel}</strong></>}
                {(tag || query) && <span style={{ color: '#9DA0B2' }}> · filtered</span>}
              </p>
            </div>
          )}

          {error && <StatusBanner type="error" message={error} />}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty filtered state */}
          {!loading && data && entries.length === 0 && (
            <div className="card">
              <EmptyState
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="#C3CAEE" strokeWidth="1.8"/>
                    <path d="M20 20l-3-3" stroke="#C3CAEE" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                }
                title="No matching entries"
                description="Try adjusting your filters or search query."
                action={
                  <button className="btn btn-secondary" style={{ height: 36, fontSize: 13 }} onClick={handleClear}>
                    Clear filters
                  </button>
                }
              />
            </div>
          )}

          {/* Entry list */}
          {!loading && entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              deleting={deletingId === entry.id}
              onClick={() => setViewingEntry(entry)}
              onEdit={setEditingEntry}
              onDelete={e => setPendingDeleteId(e.id)}
              activeTag={tag}
              onTagClick={selectTag}
              workspaceUrl={workspaceUrl}
              clampSolution
            />
          ))}
        </div>
      </div>

      {viewingEntry && (
        <EntryDetailModal
          entry={viewingEntry}
          workspaceUrl={workspaceUrl}
          onClose={() => setViewingEntry(null)}
          onEdit={() => { setEditingEntry(viewingEntry); setViewingEntry(null); }}
          onDelete={() => { setPendingDeleteId(viewingEntry.id); setViewingEntry(null); }}
        />
      )}

      {editingEntry && (
        <VerifyModal
          entry={editingEntry}
          saving={savingId === editingEntry.id}
          onSubmit={(problem, solution, verifierName) => void handleVerify(editingEntry.id, problem, solution, verifierName)}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {pendingDeleteId && (
        <ConfirmModal
          theme="danger"
          title="Delete entry"
          description="This will permanently remove the entry from the knowledge base. This cannot be undone."
          confirmLabel="Delete"
          confirming={deletingId === pendingDeleteId}
          onConfirm={() => void handleDelete()}
          onClose={() => setPendingDeleteId(null)}
        />
      )}
    </>
  );
}
