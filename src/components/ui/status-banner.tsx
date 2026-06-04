/**
 * Displays a colored banner with an icon for success, error, or info messages.
 * @param type - The severity level, which controls the color and icon.
 * @param message - The message text to display.
 */
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
