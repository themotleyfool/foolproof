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
      className={'tag-chip' + (onClick ? ' clickable' : '') + (active ? ' active-tag' : '')}
    >
      {label}
    </span>
  );
}
