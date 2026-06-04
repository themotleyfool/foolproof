/**
 * Renders a small pill-shaped tag label, optionally styled as active and clickable.
 * @param label - The text to display inside the chip.
 * @param active - Whether to apply the active (highlighted) style.
 * @param onClick - Optional click handler; makes the chip interactive when provided.
 */
export function TagChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center text-[11px] font-bold py-[2px] px-2 rounded-full border whitespace-nowrap tracking-[0.04em] ${
        active
          ? 'bg-primary-100 text-white border-primary-100'
          : 'bg-primary-8 text-primary-100 border-primary-16'
      } ${onClick ? 'cursor-pointer transition-colors duration-[120ms] hover:bg-primary-16' : ''}`}
    >
      {label}
    </span>
  );
}
