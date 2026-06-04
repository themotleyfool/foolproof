// KnowledgeBasePanel tab component
const { useState, useEffect, useRef } = React;

function KnowledgeBasePanel({ entries, onDeleteEntry }) {
  const [loading, setLoading]           = useState(true);
  const [selectedChannel, setChannel]   = useState('');
  const [tag, setTag]                   = useState('');
  const [tagSearch, setTagSearch]       = useState('');
  const [tagOpen, setTagOpen]           = useState(false);
  const [query, setQuery]               = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const [expandedIds, setExpandedIds]   = useState(new Set());
  const [deletingId, setDeletingId]     = useState(null);
  const tagRef = useRef(null);

  // Simulate initial load
  useEffect(() => {
    const t = setTimeout(() => {
      const channels = getChannels(entries);
      if (channels.length) setChannel(channels[0]);
      setLoading(false);
    }, 750);
    return () => clearTimeout(t);
  }, []);

  // Click-outside for tag dropdown
  useEffect(() => {
    function onDown(e) {
      if (tagRef.current && !tagRef.current.contains(e.target)) setTagOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function getChannels(list) {
    return [...new Set((list || []).map(e => e.channelName))].sort();
  }

  function allTags() {
    const forChannel = (entries || []).filter(e => e.channelName === selectedChannel);
    return [...new Set(forChannel.flatMap(e => e.tags))].sort();
  }

  function filteredEntries() {
    return (entries || [])
      .filter(e => !selectedChannel || e.channelName === selectedChannel)
      .filter(e => !tag || e.tags.includes(tag))
      .filter(e => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return e.problem.toLowerCase().includes(q) || e.solution.toLowerCase().includes(q);
      });
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearchQuery(query);
  }

  function clearSearch() {
    setQuery('');
    setSearchQuery('');
  }

  function toggleExpand(id) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleDelete(id) {
    setDeletingId(id);
    setTimeout(() => {
      onDeleteEntry(id);
      setDeletingId(null);
    }, 300);
  }

  function handleTagSelect(t) {
    setTag(t); setTagSearch(t); setTagOpen(false);
  }
  function clearTag() {
    setTag(''); setTagSearch(''); setTagOpen(false);
  }

  const channels  = getChannels(entries);
  const filtered  = loading ? [] : filteredEntries();
  const visibleTags = allTags().filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()));

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!channels.length) {
    return (
      <div className="card">
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 10h16M4 14h10" stroke="#C3CAEE" strokeWidth="1.8" strokeLinecap="round"/></svg>}
          title="No knowledge bases yet"
          description="Scan a Slack channel to start extracting problem/solution pairs."
          action={null}
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
              onClick={() => { setChannel(ch); clearTag(); clearSearch(); }}
              className={'channel-chip' + (selectedChannel === ch ? ' active' : '')}
            >
              #{ch}
            </button>
          ))}
        </div>

        {/* Search row */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tag dropdown */}
          <div ref={tagRef} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D7DCF4', borderRadius: 4, background: 'white', overflow: 'hidden', width: 154 }}>
              <input
                className="input"
                style={{ border: 'none', borderRadius: 0, boxShadow: 'none', padding: '9px 10px', width: '100%' }}
                value={tagSearch}
                onChange={e => { setTagSearch(e.target.value); setTag(''); setTagOpen(true); }}
                onFocus={() => setTagOpen(true)}
                placeholder="Filter by tag"
              />
              {tag && (
                <button type="button" onClick={clearTag} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 8px', color: '#9DA0B2', flexShrink: 0, lineHeight: 1 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>
            {tagOpen && visibleTags.length > 0 && (
              <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'white', border: '1px solid #EBEBEF', borderRadius: 6, boxShadow: '0 8px 24px rgba(2,10,56,0.1)', maxHeight: 200, overflowY: 'auto', padding: '4px 0', listStyle: 'none', margin: '4px 0 0' }}>
                {visibleTags.map(t => (
                  <li
                    key={t}
                    onMouseDown={() => handleTagSelect(t)}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontWeight: t === tag ? 700 : 400, color: t === tag ? '#0522BA' : '#0A0A0A', background: t === tag ? '#F5F6FC' : 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F5F6FC'}
                    onMouseLeave={e => e.currentTarget.style.background = t === tag ? '#F5F6FC' : 'transparent'}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Text search */}
          <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
            <input
              className="input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search problems and solutions"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Search</button>
          {(tag || searchQuery) && (
            <button type="button" className="btn btn-secondary" style={{ height: 40 }} onClick={() => { clearTag(); clearSearch(); }}>
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Results count */}
      {!loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, color: '#6F6F6F', margin: 0 }}>
            <strong style={{ color: '#0A0A0A' }}>{filtered.length}</strong>{' '}
            {filtered.length === 1 ? 'entry' : 'entries'}
            {selectedChannel && <> in <strong style={{ color: '#0A0A0A' }}>#{selectedChannel}</strong></>}
            {(tag || searchQuery) && <span style={{ color: '#9DA0B2' }}> · filtered</span>}
          </p>
        </div>
      )}

      {/* Empty filtered state */}
      {!loading && filtered.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#C3CAEE" strokeWidth="1.8"/><path d="M20 20l-3-3" stroke="#C3CAEE" strokeWidth="1.8" strokeLinecap="round"/></svg>}
            title="No matching entries"
            description="Try adjusting your filters or search query."
            action={<button className="btn btn-secondary" style={{ height: 36, fontSize: 13 }} onClick={() => { clearTag(); clearSearch(); }}>Clear filters</button>}
          />
        </div>
      )}

      {/* Entry list */}
      {filtered.map(entry => {
        const expanded = expandedIds.has(entry.id);
        const deleting = deletingId === entry.id;
        return (
          <div
            key={entry.id}
            className="entry-card animate-in"
            style={{ opacity: deleting ? 0 : 1, transform: deleting ? 'scale(0.98)' : 'scale(1)', transition: 'opacity 0.25s, transform 0.25s' }}
          >
            {/* Delete button */}
            <button className="entry-delete-btn" onClick={() => handleDelete(entry.id)} title="Delete entry">
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>

            {/* Problem */}
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: '0 24px 6px 0', lineHeight: 1.4 }}>
              {entry.problem}
            </p>

            {/* Solution */}
            <p style={{ fontSize: 13, color: '#515151', margin: '0 0 10px', lineHeight: 1.6,
              display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2,
              WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden',
            }}>
              {entry.solution}
            </p>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                {entry.tags.map(t => (
                  <TagChip key={t} label={t} onClick={() => { handleTagSelect(t); setTagSearch(t); }} />
                ))}
              </div>
              <ConfidenceMeter level={entry.confidence} />
              <span style={{ fontSize: 11, color: '#9DA0B2', fontWeight: 500, whiteSpace: 'nowrap', marginLeft: 4 }}>
                {formatDate(entry.scannedAt)}
              </span>
            </div>

            {/* Expand messages toggle */}
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
                    <div key={msg.ts} style={{ padding: '8px 12px', borderBottom: i < entry.rawMessages.length - 1 ? '1px solid #EBEDF9' : 'none', display: 'flex', gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EBEDF9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#80849B' }}>
                        {msg.user.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#373D5B', marginRight: 6 }}>{msg.user}</span>
                        <span style={{ fontSize: 12, color: '#515151', lineHeight: 1.5 }}>{msg.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { KnowledgeBasePanel });
