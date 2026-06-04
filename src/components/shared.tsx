import type { KnowledgeEntry } from '../types';

export function ConfidenceMeter({ level }: { level: KnowledgeEntry['confidence'] }) {
  const cfg = {
    high:   { filled: 3, color: '#178217', label: 'High' },
    medium: { filled: 2, color: '#CF7F00', label: 'Med'  },
    low:    { filled: 1, color: '#E31C28', label: 'Low'  },
  } as const;
  const { filled, color, label } = cfg[level] ?? cfg.low;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: 2, flexShrink: 0,
          background: i <= filled ? color : '#EBEBEF',
          transition: 'background 0.2s',
        }} />
      ))}
      <span style={{ fontSize: 11, fontWeight: 700, color, marginLeft: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </span>
    </div>
  );
}

export function TagChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className={'tag-chip' + (onClick ? ' clickable' : '') + (active ? ' active-tag' : '')}
    >
      {label}
    </span>
  );
}

export function StatusBanner({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) {
  const cls = { success: 'banner-success', error: 'banner-error', info: 'banner-info' } as const;
  const icon = {
    success: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="7" cy="7" r="6.5" stroke="#43B02A" strokeWidth="1.2"/>
        <path d="M4.5 7l2 2 3-3" stroke="#43B02A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    error: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="7" cy="7" r="6.5" stroke="#E31C28" strokeWidth="1.2"/>
        <path d="M7 4v3.5M7 9.5v.5" stroke="#E31C28" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    info: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="7" cy="7" r="6.5" stroke="#0522BA" strokeWidth="1.2"/>
        <path d="M7 6v4M7 4.5v.5" stroke="#0522BA" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  };
  return (
    <div className={`banner ${cls[type]}`}>
      {icon[type]}
      <span>{message}</span>
    </div>
  );
}

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

interface Step { label: string; }

export function ProgressStepper({ steps, currentStep }: { steps: Step[]; currentStep: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((step, i) => {
        const isDone   = i < currentStep;
        const isActive = i === currentStep;
        const isLast   = i === steps.length - 1;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, flexShrink: 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: isDone ? '#43B02A' : isActive ? '#0522BA' : '#F5F5F7',
                border: `2px solid ${isDone ? '#43B02A' : isActive ? '#0522BA' : '#EBEBEF'}`,
                transition: 'all 0.3s ease',
              }}>
                {isDone && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {isActive && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white', animation: 'pulse-dot 1s ease-in-out infinite' }} />
                )}
              </div>
              {!isLast && (
                <div style={{ width: 2, height: 26, background: isDone ? '#43B02A' : '#EBEBEF', borderRadius: 1, transition: 'background 0.4s ease 0.15s' }} />
              )}
            </div>
            <div style={{ paddingTop: 2, paddingBottom: isLast ? 0 : 26 }}>
              <span style={{
                fontSize: 14, lineHeight: '22px',
                fontWeight: isActive ? 700 : isDone ? 500 : 400,
                color: isDone ? '#178217' : isActive ? '#0A0A0A' : '#9DA0B2',
                transition: 'color 0.3s',
              }}>
                {isDone ? '✓ ' : ''}{step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', textAlign: 'center', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F5F6FC', border: '1px solid #EBEDF9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C3CAEE', marginBottom: 4 }}>
        {icon}
      </div>
      <p style={{ fontSize: 16, fontWeight: 900, color: '#0A0A0A', margin: 0 }}>{title}</p>
      <p style={{ fontSize: 14, color: '#6F6F6F', margin: 0, maxWidth: 340, lineHeight: 1.6 }}>{description}</p>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
