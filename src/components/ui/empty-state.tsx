import type { ReactNode } from 'react';

/**
 * Renders a centered empty state with an icon, title, description, and optional action.
 * @param icon - An SVG or React node to display as the empty state illustration.
 * @param title - The primary heading text.
 * @param description - Supporting text shown below the title.
 * @param action - Optional interactive element (e.g. a button) rendered below the description.
 */
export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-12 px-6 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-primary-4 border border-primary-8 flex items-center justify-center text-primary-24 mb-1">
        {icon}
      </div>
      <p className="text-base font-black text-fg-strong m-0">{title}</p>
      <p className="text-sm text-fg-muted m-0 max-w-[340px] leading-[1.6]">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
