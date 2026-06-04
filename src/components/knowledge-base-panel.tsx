import { useEffect, useState, useMemo } from 'react';
import { ComboboxInput } from '../ui/input';
import { ConfidenceMeter, EmptyState, SkeletonCard, StatusBanner, TagChip } from './shared';
import type { KnowledgeEntry } from '../types';

interface KbResponse {
  entries: KnowledgeEntry[];
  total: number;
}

/**
 * Builds a Slack deep link URL for a message or thread.
 * For replies, appends thread_ts and cid query params so Slack opens the message in-thread.
 * @param workspaceUrl - The base workspace URL (e.g. "https://fool.slack.com/").
 * @param channelId - The Slack channel ID.
 * @param ts - The timestamp of the specific message to link to.
 * @param threadTs - The parent thread timestamp; omit or pass the same value as ts for the root message.
 * @returns A full Slack permalink URL.
 */
function slackLink(workspaceUrl: string, channelId: string, ts: string, threadTs?: string): string {
  const pTs = 'p' + ts.replace('.', '');
  const base = `${workspaceUrl}archives/${channelId}/${pTs}`;
  return threadTs && threadTs !== ts
    ? `${base}?thread_ts=${threadTs}&cid=${channelId}`
    : base;
}

/**
 * An icon-only anchor that opens a Slack permalink in a new tab.
 * @param href - The Slack deep link URL to navigate to.
 */
function SlackLinkIcon({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in Slack"
      onClick={e => e.stopPropagation()}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#9DA0B2', flexShrink: 0, lineHeight: 1, textDecoration: 'none' }}
      className="slack-link-icon"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 1h3m0 0v3m0-3L5.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
  );
}

/**
 * Tab panel for browsing, filtering, and deleting knowledge base entries across channels.
 * Supports filtering by channel, tag, and free-text search, and shows expandable raw messages.
 * @param onDelete - Optional callback invoked after an entry is successfully deleted.
 */
export function KnowledgeBasePanel({ onDelete }: { onDelete?: () => void }) {
  const [channels, setChannels] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tag, setTag] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<KbResponse | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
    setTag('');
    setTagSearch('');
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
   * Toggles the expanded state of a knowledge entry's raw message list.
   * @param id - The entry ID to expand or collapse.
   */
  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /**
   * Animates an entry out, deletes it via the API, then refreshes the entry list.
   * @param id - The entry ID to delete.
   */
  async function handleDelete(id: string) {
    setDeletingId(id);
    await new Promise(res => setTimeout(res, 300));
    try {
      await fetch(`/api/knowledge/${selectedChannel}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setDeletingId(null);
      await fetchEntries(selectedChannel, tag, query);
      onDelete?.();
    } catch {
      setDeletingId(null);
    }
  }

  /**
   * Formats an ISO 8601 timestamp as a short human-readable date (e.g. "Jun 4, 2026").
   * @param iso - An ISO 8601 date string.
   * @returns A localized short date string.
   */
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const tagOptions = useMemo(
    () => allTags.map(t => ({ value: t, label: t })),
    [allTags]
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Filter card */}
      <div className="card card-pad">
        {/* Channel selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {channels.map(ch => (
            <button
              key={ch}
              onClick={() => { setSelectedChannel(ch); handleClear(); }}
              className={'channel-chip' + (selectedChannel === ch ? ' active' : '')}
            >
              #{ch}
            </button>
          ))}
        </div>

        {/* Search row */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tag dropdown */}
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

          {/* Text search */}
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
      {!loading && entries.map(entry => {
        const expanded = expandedIds.has(entry.id);
        const deleting = deletingId === entry.id;
        return (
          <div
            key={entry.id}
            className="entry-card animate-in"
            style={{ opacity: deleting ? 0 : 1, transform: deleting ? 'scale(0.98)' : 'scale(1)', transition: 'opacity 0.25s, transform 0.25s' }}
          >
            <button className="entry-delete-btn" onClick={() => void handleDelete(entry.id)} title="Delete entry">
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: '0 24px 6px 0', lineHeight: 1.4 }}>
              {entry.problem}
            </p>

            <p style={{
              fontSize: 13, color: '#515151', margin: '0 0 10px', lineHeight: 1.6,
              display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2,
              WebkitBoxOrient: 'vertical' as const, overflow: expanded ? 'visible' : 'hidden',
            }}>
              {entry.solution}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                {entry.tags.map(t => (
                  <TagChip key={t} label={t} active={t === tag} onClick={() => selectTag(t)} />
                ))}
              </div>
              <ConfidenceMeter level={entry.confidence} />
              <span style={{ fontSize: 11, color: '#9DA0B2', fontWeight: 500, whiteSpace: 'nowrap', marginLeft: 4 }}>
                {formatDate(entry.scannedAt)}
              </span>
              {workspaceUrl && (
                <SlackLinkIcon href={slackLink(workspaceUrl, entry.channelId, entry.threadTs)} />
              )}
            </div>

            {entry.rawMessages.length > 0 && (
              <div style={{ marginTop: 10, borderTop: '1px solid #EBEBEF', paddingTop: 8 }}>
                <button
                  onClick={() => toggleExpand(entry.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#0522BA', fontSize: 12, fontWeight: 700, padding: 0, fontFamily: 'var(--font-sans)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="M1.5 3.5L5 7l3.5-3.5" stroke="#0522BA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {expanded ? 'Hide' : 'Show'} {entry.rawMessages.length} messages
                </button>

                {expanded && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 0, background: '#F5F6FC', borderRadius: 6, overflow: 'hidden', border: '1px solid #EBEDF9' }}>
                    {entry.rawMessages.map((msg, i) => (
                      <div key={msg.ts} style={{ padding: '8px 12px', borderBottom: i < entry.rawMessages.length - 1 ? '1px solid #EBEDF9' : 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EBEDF9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#80849B' }}>
                          {(msg.userName ?? msg.user).charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#373D5B', marginRight: 6 }}>{msg.userName ?? msg.user}</span>
                          <span style={{ fontSize: 12, color: '#515151', lineHeight: 1.5 }}>{msg.text}</span>
                        </div>
                        {workspaceUrl && (
                          <SlackLinkIcon href={slackLink(workspaceUrl, entry.channelId, msg.ts, entry.threadTs)} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
