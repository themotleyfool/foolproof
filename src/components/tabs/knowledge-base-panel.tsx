import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { deleteEntry, fetchChannels, fetchEntries, patchEntry } from '../../lib/api';
import type { KnowledgeEntry } from '../../types';
import { ComboboxInput } from '../../ui/input';
import { EntryCard } from '../entry-card';
import { ConfirmModal } from '../modals/confirm-modal';
import { EntryDetailModal } from '../modals/entry-detail-modal';
import { VerifyModal } from '../modals/verify-modal';
import { EmptyState, SkeletonCard, StatusBanner } from '../ui';

/**
 * Tab panel for browsing, filtering, and deleting knowledge base entries across channels.
 * Supports filtering by channel, tag, and free-text search, and shows expandable raw messages.
 */
export function KnowledgeBasePanel() {
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState('');
  const [channelSearch, setChannelSearch] = useState('');
  // Draft filter state (shown in inputs, committed on submit)
  const [draftTag, setDraftTag] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  // Active filter state (drives query key, committed on form submit)
  const [activeTag, setActiveTag] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  // Modal state
  const [viewingEntry, setViewingEntry] = useState<KnowledgeEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const workspaceUrl = import.meta.env.VITE_SLACK_WORKSPACE_URL as string ?? '';

  // Channels list
  const {
    data: channelsData,
    isLoading: channelsLoading,
    error: channelsError,
  } = useQuery({
    queryKey: ['knowledge', 'channels'],
    queryFn: fetchChannels,
  });
  const channels = useMemo(() => channelsData?.channels ?? [], [channelsData]);

  // Fall back to the first channel when none is explicitly selected — avoids a setState-in-effect
  const effectiveChannel = selectedChannel || channels[0] || '';

  // All tags — always fetches the unfiltered list so the tag dropdown stays complete.
  // Uses the same query key as the unfiltered entries query, so TanStack Query deduplicates the request.
  const { data: allTagsData } = useQuery({
    queryKey: ['knowledge', 'entries', effectiveChannel, '', ''],
    queryFn: () => fetchEntries(effectiveChannel),
    enabled: !!effectiveChannel,
    select: data => [...new Set(data.entries.flatMap(e => e.tags))].sort(),
  });
  const allTags = useMemo(() => allTagsData ?? [], [allTagsData]);

  // Filtered entries — re-runs whenever committed filters or channel changes
  const {
    data: entriesData,
    isLoading: entriesLoading,
    isFetching: entriesFetching,
    error: entriesError,
  } = useQuery({
    queryKey: ['knowledge', 'entries', effectiveChannel, activeTag, activeQuery],
    queryFn: () => fetchEntries(effectiveChannel, activeTag, activeQuery),
    enabled: !!effectiveChannel,
  });
  const entries = useMemo(() => entriesData?.entries ?? [], [entriesData]);

  // Delete mutation — includes 300 ms delay for exit animation
  const deleteMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      setDeletingId(id);
      await new Promise(res => setTimeout(res, 300));
      await deleteEntry(effectiveChannel, id);
    },
    onSuccess: () => {
      setPendingDeleteId(null);
      setDeletingId(null);
      void queryClient.invalidateQueries({ queryKey: ['knowledge', 'entries', effectiveChannel] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: () => {
      setPendingDeleteId(null);
      setDeletingId(null);
    },
  });

  // Verify / patch mutation
  const verifyMutation = useMutation({
    mutationFn: ({
      id,
      problem,
      solution,
      verifiedBy,
    }: {
      id: string;
      problem: string;
      solution: string;
      verifiedBy: string;
    }) => patchEntry(effectiveChannel, id, { problem, solution, verifiedBy }),
    onSuccess: () => {
      setEditingEntry(null);
      void queryClient.invalidateQueries({ queryKey: ['knowledge', 'entries', effectiveChannel] });
    },
  });

  /**
   * Selects a channel, resetting all filters so the new channel starts unfiltered.
   * @param ch - The channel name to select.
   */
  function selectChannel(ch: string) {
    setSelectedChannel(ch);
    setDraftTag('');
    setDraftQuery('');
    setActiveTag('');
    setActiveQuery('');
  }

  /**
   * Handles search form submission, committing draft filters to drive a new entries query.
   * @param e - The form submit event.
   */
  function handleSearch(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setActiveTag(draftTag);
    setActiveQuery(draftQuery);
  }

  /**
   * Selects a tag from the dropdown, updating the draft tag input.
   * @param t - The tag string to select.
   */
  function selectTag(t: string) {
    setDraftTag(t);
  }

  /**
   * Clears the draft tag input.
   */
  function clearTag() {
    setDraftTag('');
  }

  /**
   * Clears all active and draft filters, resetting the entry list to unfiltered.
   */
  function handleClear() {
    setDraftTag('');
    setDraftQuery('');
    setActiveTag('');
    setActiveQuery('');
  }

  /**
   * Triggers entry deletion after the user confirms the confirm modal.
   */
  function handleDelete() {
    if (!pendingDeleteId) return;
    deleteMutation.mutate({ id: pendingDeleteId });
  }

  /**
   * Submits a problem/solution edit and verification stamp for an entry via PATCH.
   * @param id - The entry ID to patch.
   * @param problem - The updated problem text.
   * @param solution - The updated solution text.
   * @param verifierName - The admin's name to record on the verification.
   */
  function handleVerify(id: string, problem: string, solution: string, verifierName: string) {
    verifyMutation.mutate({ id, problem, solution, verifiedBy: verifierName });
  }

  const tagOptions = useMemo(() => allTags.map(t => ({ value: t, label: t })), [allTags]);
  const filteredChannels = useMemo(
    () => channels.filter(ch => ch.toLowerCase().includes(channelSearch.toLowerCase())),
    [channels, channelSearch]
  );

  const loading = entriesLoading || entriesFetching;
  const error = channelsError
    ? (channelsError instanceof Error ? channelsError.message : 'Failed to load channels')
    : entriesError
    ? (entriesError instanceof Error ? entriesError.message : 'Failed to load entries')
    : verifyMutation.error
    ? (verifyMutation.error instanceof Error ? verifyMutation.error.message : 'Failed to save')
    : null;

  if (channelsLoading) {
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
                className={'kb-channel-btn' + (effectiveChannel === ch ? ' active' : '')}
                onClick={() => selectChannel(ch)}
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
                value={draftTag}
                onChange={text => { setDraftTag(text); }}
                onSelect={option => selectTag(option.value)}
                onClear={clearTag}
                placeholder="Filter by tag"
                style={{ width: 154 }}
              />
              <div style={{ flex: 1, minWidth: 180 }}>
                <input
                  className="input"
                  value={draftQuery}
                  onChange={e => setDraftQuery(e.target.value)}
                  placeholder="Search problems and solutions"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Search</button>
              {(activeTag || activeQuery) && (
                <button type="button" className="btn btn-secondary" style={{ height: 40 }} onClick={handleClear}>
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* Results count */}
          {!loading && entriesData && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, color: '#6F6F6F', margin: 0 }}>
                <strong style={{ color: '#0A0A0A' }}>{entries.length}</strong>{' '}
                {entries.length === 1 ? 'entry' : 'entries'}
                {effectiveChannel && <> in <strong style={{ color: '#0A0A0A' }}>#{effectiveChannel}</strong></>}
                {(activeTag || activeQuery) && <span style={{ color: '#9DA0B2' }}> · filtered</span>}
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
          {!loading && entriesData && entries.length === 0 && (
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
              activeTag={activeTag}
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
          saving={verifyMutation.isPending}
          onSubmit={(problem, solution, verifierName) => handleVerify(editingEntry.id, problem, solution, verifierName)}
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
          onConfirm={handleDelete}
          onClose={() => setPendingDeleteId(null)}
        />
      )}
    </>
  );
}
