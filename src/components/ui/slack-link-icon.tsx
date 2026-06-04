/**
 * An icon-only anchor that opens a Slack permalink in a new tab.
 * @param href - The Slack deep link URL to navigate to.
 */
export function SlackLinkIcon({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in Slack"
      onClick={e => e.stopPropagation()}
      className="inline-flex items-center justify-center text-content-36 shrink-0 leading-none no-underline opacity-60 transition-[opacity,color] duration-[120ms] hover:opacity-100 hover:text-[#4A154B]"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 1h3m0 0v3m0-3L5.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
  );
}
