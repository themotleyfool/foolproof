/**
 * Green badge shown on entries that an admin has verified.
 * @param verifiedBy - Name of the admin who verified the entry.
 * @param verifiedAt - ISO 8601 timestamp of when the entry was verified.
 */
export function VerifiedBadge({ verifiedBy, verifiedAt }: { verifiedBy: string; verifiedAt: string }) {
  const date = new Date(verifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold py-[2px] px-[7px] rounded-full border border-[#A3E4C1] bg-[#E6FAF0] text-[#1A7F4B] whitespace-nowrap tracking-[0.02em]"
      title={`Verified by ${verifiedBy} · ${date}`}
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
        <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Verified
    </span>
  );
}
