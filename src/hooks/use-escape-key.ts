import { useEffect } from 'react';

/**
 * Attaches a keydown listener that calls onClose when the user presses Escape.
 * Cleans up the listener when the component unmounts or onClose changes.
 * @param onClose - Callback invoked on Escape keypress.
 */
export function useEscapeKey(onClose: () => void): void {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);
}
