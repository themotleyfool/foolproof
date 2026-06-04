/**
 * Renders an animated placeholder card shown while knowledge base entries are loading.
 */
export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div className="skeleton" style={{ height: 14, width: '55%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 10, width: '12%', borderRadius: 4 }} />
      </div>
      <div className="skeleton" style={{ height: 11, width: '100%', borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 11, width: '72%', borderRadius: 4 }} />
      <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
        <div className="skeleton" style={{ height: 18, width: 46, borderRadius: 99 }} />
        <div className="skeleton" style={{ height: 18, width: 58, borderRadius: 99 }} />
        <div className="skeleton" style={{ height: 18, width: 40, borderRadius: 99 }} />
      </div>
    </div>
  );
}
