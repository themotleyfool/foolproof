import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { deleteEntry, fetchChannels, fetchEntries, patchEntry } from '../../lib/api';
import type { KnowledgeEntry } from '../../types';
import { EntryCard } from '../entry-card';
import { ConfirmModal } from '../modals/confirm-modal';
import { EntryDetailModal } from '../modals/entry-detail-modal';
import { VerifyModal } from '../modals/verify-modal';
import { EmptyState, SkeletonCard, StatusBanner } from '../ui';
import { ComboboxInput } from '../ui/input';

const inputCls = 'w-full border border-border-subtle rounded-[4px] py-[9px] px-3 text-sm font-medium text-fg-strong bg-white outline-none transition-[border-color,box-shadow] duration-[120ms] focus:border-primary-100 focus:[box-shadow:0_0_0_3px_#EBEDF9] placeholder:text-fg-faint disabled:bg-primary-4 disabled:opacity-65 disabled:cursor-not-allowed';

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
      <div className="flex flex-col gap-[10px]">
        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="bg-white border border-divider rounded-[8px] shadow-card">
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
      <div className="flex gap-4 items-start">
        {/* Channel sidebar */}
        <div className="bg-white border border-divider rounded-[8px] shadow-card w-[200px] shrink-0 sticky top-7 self-start overflow-hidden">
          {/* Header */}
          <div className="px-[14px] py-[11px] border-b border-divider flex items-center justify-between">
            <span className="text-[11px] font-bold text-content-36 uppercase tracking-[0.08em]">
              Channels
            </span>
            <span className="text-[11px] font-bold bg-primary-8 text-primary-100 rounded-full px-[7px] py-[1px]">
              {channels.length}
            </span>
          </div>

          {/* Search */}
          <div className="px-[10px] py-[7px] border-b border-divider flex items-center gap-[7px]">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <circle cx="5" cy="5" r="4" stroke="#C2C4CF" strokeWidth="1.3"/>
              <path d="M10 10L8 8" stroke="#C2C4CF" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              value={channelSearch}
              onChange={e => setChannelSearch(e.target.value)}
              placeholder="Search…"
              className="flex-1 border-0 outline-none text-[13px] text-fg-strong bg-transparent min-w-0 placeholder:text-content-36"
            />
            {channelSearch && (
              <button
                type="button"
                onClick={() => setChannelSearch('')}
                className="border-0 bg-transparent cursor-pointer p-0 text-content-24 flex items-center shrink-0"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Channel list */}
          <div className="overflow-y-auto max-h-[calc(100vh-260px)]">
            {filteredChannels.length === 0 ? (
              <p className="text-[13px] text-content-36 px-[14px] py-3 m-0">No channels found</p>
            ) : filteredChannels.map(ch => (
              <button
                key={ch}
                className={`w-full px-[14px] py-2 border-0 border-b border-content-4 last:border-b-0 bg-transparent text-[13px] text-left cursor-pointer flex items-center gap-1 transition-colors duration-[120ms] hover:bg-primary-4 ${
                  effectiveChannel === ch
                    ? 'bg-primary-8 text-primary-100 font-bold'
                    : 'font-medium text-fg-default'
                }`}
                onClick={() => selectChannel(ch)}
              >
                <span className={`font-normal text-xs shrink-0 ${effectiveChannel === ch ? 'text-primary-24' : 'text-content-24'}`}>#</span>
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-[14px]">
          {/* Filter card */}
          <div className="bg-white border border-divider rounded-[8px] shadow-card p-6">
            <form onSubmit={handleSearch} className="flex gap-2 items-center flex-wrap">
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
              <div className="flex-1 min-w-[180px]">
                <input
                  className={inputCls}
                  value={draftQuery}
                  onChange={e => setDraftQuery(e.target.value)}
                  placeholder="Search problems and solutions"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-5 rounded-[8px] border-0 bg-primary-100 text-sm font-bold text-white cursor-pointer inline-flex items-center outline-none transition-colors duration-[120ms] hover:bg-primary-120 shrink-0"
              >
                Search
              </button>
              {(activeTag || activeQuery) && (
                <button
                  type="button"
                  className="h-10 px-5 rounded-[8px] border border-primary-24 bg-white text-sm font-bold text-primary-100 cursor-pointer inline-flex items-center outline-none transition-colors duration-[120ms] hover:bg-primary-8"
                  onClick={handleClear}
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* Results count */}
          {!loading && entriesData && (
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-fg-muted m-0">
                <strong className="text-fg-strong">{entries.length}</strong>{' '}
                {entries.length === 1 ? 'entry' : 'entries'}
                {effectiveChannel && <> in <strong className="text-fg-strong">#{effectiveChannel}</strong></>}
                {(activeTag || activeQuery) && <span className="text-content-36"> · filtered</span>}
              </p>
            </div>
          )}

          {error && <StatusBanner type="error" message={error} />}

          {loading && (
            <div className="flex flex-col gap-[10px]">
              {[1, 2].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty filtered state */}
          {!loading && entriesData && entries.length === 0 && (
            <div className="bg-white border border-divider rounded-[8px] shadow-card">
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
                  <button
                    className="h-9 px-3 rounded-[8px] border border-primary-24 bg-white text-[13px] font-bold text-primary-100 cursor-pointer inline-flex items-center outline-none transition-colors duration-[120ms] hover:bg-primary-8"
                    onClick={handleClear}
                  >
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
