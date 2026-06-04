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

  const confirmCls = theme === 'danger'
    ? 'bg-red-50 text-white hover:bg-[#C41520] disabled:bg-red-4 disabled:text-[#C41520] disabled:cursor-not-allowed'
    : 'bg-green-50 text-white hover:bg-green-80 disabled:bg-green-4 disabled:text-green-80 disabled:cursor-not-allowed';

  return (
    <div className="fixed inset-0 bg-[rgba(2,10,56,0.45)] z-[100] flex items-center justify-center p-6 animate-fade-in-up" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-modal max-w-[420px] w-full p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
      >
        <div className="flex flex-col gap-[6px]">
          <p id="confirm-modal-title" className="text-base font-bold text-fg-strong m-0">
            {title}
          </p>
          <p id="confirm-modal-desc" className="text-sm text-fg-default m-0 leading-[1.6]">
            {description}
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            className="h-9 px-3 rounded-[8px] border border-primary-24 bg-white text-[13px] font-bold text-primary-100 cursor-pointer inline-flex items-center gap-[7px] outline-none transition-colors duration-[120ms] hover:bg-primary-8 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={confirming}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`h-9 px-3 rounded-[8px] border-0 text-[13px] font-bold cursor-pointer inline-flex items-center gap-[7px] outline-none transition-colors duration-[120ms] ${confirmCls}`}
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
