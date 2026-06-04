import type { KnowledgeEntry } from '../../types';

/**
 * Displays a three-segment confidence indicator with a color-coded label.
 * @param level - The confidence level to render: 'high', 'medium', or 'low'.
 */
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
