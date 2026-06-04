import type { KnowledgeEntry } from '../../types';

const DESCRIPTIONS: Record<KnowledgeEntry['confidence'], string> = {
  high:   'AI found a clear, explicit solution confirmed in the thread.',
  medium: 'AI inferred a likely solution, but it wasn\'t explicitly confirmed.',
  low:    'AI made a guess based on limited or ambiguous information, with no clear confirmation.',
};

/**
 * Displays a three-segment confidence indicator with a color-coded label and hover popover.
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
    <div className="group/cm relative flex items-center gap-[3px]">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className={`w-[7px] h-[7px] rounded-[2px] shrink-0 transition-colors duration-200 ${i <= filled ? filledCls : 'bg-content-8'}`}
        />
      ))}
      <span className={`text-[11px] font-bold ml-[3px] uppercase tracking-[0.07em] ${textCls}`}>
        {label}
      </span>

      {/* Popover */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[200px] rounded-[6px] bg-fg-strong px-3 py-2 shadow-lg opacity-0 group-hover/cm:opacity-100 transition-opacity duration-150 z-10">
        <p className="text-[11px] font-bold text-white uppercase tracking-[0.07em] m-0 mb-[3px]">
          {label} confidence
        </p>
        <p className="text-[11px] text-white/70 m-0 leading-[1.5]">
          {DESCRIPTIONS[level]}
        </p>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-fg-strong" />
      </div>
    </div>
  );
}
