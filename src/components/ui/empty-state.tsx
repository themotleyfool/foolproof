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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', textAlign: 'center', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F5F6FC', border: '1px solid #EBEDF9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C3CAEE', marginBottom: 4 }}>
        {icon}
      </div>
      <p style={{ fontSize: 16, fontWeight: 900, color: '#0A0A0A', margin: 0 }}>{title}</p>
      <p style={{ fontSize: 14, color: '#6F6F6F', margin: 0, maxWidth: 340, lineHeight: 1.6 }}>{description}</p>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
