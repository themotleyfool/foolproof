/**
 * Displays a colored banner with an icon for success, error, or info messages.
 * @param type - The severity level, which controls the color and icon.
 * @param message - The message text to display.
 */
export function StatusBanner({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) {
  const cls = {
    success: 'bg-green-4 border border-green-50 text-green-80',
    error:   'bg-red-4 border border-red-50 text-[#C41520]',
    info:    'bg-primary-4 border border-primary-24 text-primary-100',
  } as const;
  const icon = {
    success: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-[1px]">
        <circle cx="7" cy="7" r="6.5" stroke="#43B02A" strokeWidth="1.2"/>
        <path d="M4.5 7l2 2 3-3" stroke="#43B02A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    error: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-[1px]">
        <circle cx="7" cy="7" r="6.5" stroke="#E31C28" strokeWidth="1.2"/>
        <path d="M7 4v3.5M7 9.5v.5" stroke="#E31C28" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    info: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-[1px]">
        <circle cx="7" cy="7" r="6.5" stroke="#0522BA" strokeWidth="1.2"/>
        <path d="M7 6v4M7 4.5v.5" stroke="#0522BA" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  };
  return (
    <div className={`rounded-[4px] px-[14px] py-[10px] text-sm font-medium leading-[1.55] flex items-start gap-2 ${cls[type]}`}>
      {icon[type]}
      <span>{message}</span>
    </div>
  );
}
