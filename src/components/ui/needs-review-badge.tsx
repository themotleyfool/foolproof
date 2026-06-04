/** Amber badge shown on entries that have not yet been admin-verified. */
export function NeedsReviewBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold py-[2px] px-[7px] rounded-full border border-[#F5D48A] bg-[#FFF8E6] text-[#92620C] whitespace-nowrap tracking-[0.02em]">
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
        <circle cx="4.5" cy="4.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M4.5 2.5v2.25l1.25 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      Needs review
    </span>
  );
}
