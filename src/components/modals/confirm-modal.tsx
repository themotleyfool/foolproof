import { useEffect } from 'react';

export interface ConfirmModalProps {
  theme: 'danger' | 'success';
  title: string;
  description: string;
  confirmLabel: string;
  confirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Reusable confirmation dialog with danger or success theming.
 * @param theme - Visual theme for the confirm button: 'danger' (red) or 'success' (green).
 * @param title - Heading text displayed in the modal.
 * @param description - Supporting text explaining the action.
 * @param confirmLabel - Label for the confirm button.
 * @param confirming - Whether the confirm action is in progress (disables both buttons).
 * @param onConfirm - Called when the user clicks the confirm button.
 * @param onClose - Called when the modal should be dismissed.
 */
export function ConfirmModal({ theme, title, description, confirmLabel, confirming, onConfirm, onClose }: ConfirmModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        style={{ maxWidth: 420 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p id="confirm-modal-title" style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', margin: 0 }}>
            {title}
          </p>
          <p id="confirm-modal-desc" style={{ fontSize: 14, color: '#515151', margin: 0, lineHeight: 1.6 }}>
            {description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ height: 36, fontSize: 13 }}
            onClick={onClose}
            disabled={confirming}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn btn-confirm-${theme}`}
            style={{ height: 36, fontSize: 13 }}
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
