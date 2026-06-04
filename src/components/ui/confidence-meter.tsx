import type { KnowledgeEntry } from '../../types';

/**
 * Displays a three-segment confidence indicator with a color-coded label.
 * @param level - The confidence level to render: 'high', 'medium', or 'low'.
 */
export function ConfidenceMeter({ level }: { level: KnowledgeEntry['confidence'] }) {
  const cfg = {
    high:   { filled: 3, filledCls: 'bg-green-80',    textCls: 'text-green-80',    label: 'High' },
    medium: { filled: 2, filledCls: 'bg-[#CF7F00]',   textCls: 'text-[#CF7F00]',   label: 'Med'  },
    low:    { filled: 1, filledCls: 'bg-red-50',       textCls: 'text-red-50',       label: 'Low'  },
  } as const;
  const { filled, filledCls, textCls, label } = cfg[level] ?? cfg.low;
  return (
    <div className="flex items-center gap-[3px]">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className={`w-[7px] h-[7px] rounded-[2px] shrink-0 transition-colors duration-200 ${i <= filled ? filledCls : 'bg-content-8'}`}
        />
      ))}
      <span className={`text-[11px] font-bold ml-[3px] uppercase tracking-[0.07em] ${textCls}`}>
        {label}
      </span>
    </div>
  );
}
