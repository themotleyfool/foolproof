import { useEffect, useRef, useState } from 'react';
import type { KnowledgeEntry } from '../../types';

export interface VerifyModalProps {
  entry: KnowledgeEntry;
  saving: boolean;
  onSubmit: (problem: string, solution: string, verifierName: string) => void;
  onClose: () => void;
}

/**
 * Modal dialog for editing an entry's problem and solution text and submitting an admin verification.
 * @param entry - The knowledge entry being verified/edited.
 * @param saving - Whether a save request is in flight (disables the Submit button).
 * @param onSubmit - Called with the final problem text, solution text, and the admin's name on form submit.
 * @param onClose - Called when the modal should be dismissed.
 */
export function VerifyModal({ entry, saving, onSubmit, onClose }: VerifyModalProps) {
  const [problem, setProblem] = useState(entry.problem);
  const [solution, setSolution] = useState(entry.solution);
  const [verifierName, setVerifierName] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const problemRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    problemRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!problem.trim()) { setModalError('Problem text cannot be empty.'); return; }
    if (!solution.trim()) { setModalError('Solution text cannot be empty.'); return; }
    if (!verifierName.trim()) { setModalError('Please enter your name.'); return; }
    setModalError(null);
    onSubmit(problem.trim(), solution.trim(), verifierName.trim());
  }

  const isValid = problem.trim() && solution.trim() && verifierName.trim();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div>
          <p id="modal-title" style={{ fontSize: 11, fontWeight: 700, color: '#9DA0B2', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Edit &amp; Verify
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="label" htmlFor="modal-problem">Problem</label>
            <textarea
              id="modal-problem"
              ref={problemRef}
              className="input"
              value={problem}
              onChange={e => setProblem(e.target.value)}
              style={{ minHeight: 72, resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}
            />
          </div>

          <div>
            <label className="label" htmlFor="modal-solution">Solution</label>
            <textarea
              id="modal-solution"
              className="input"
              value={solution}
              onChange={e => setSolution(e.target.value)}
              style={{ minHeight: 140, resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}
            />
          </div>

          <div>
            <label className="label" htmlFor="modal-verifier">Your name</label>
            <input
              id="modal-verifier"
              className="input"
              value={verifierName}
              onChange={e => setVerifierName(e.target.value)}
              placeholder="e.g. Jane Smith"
              autoComplete="name"
            />
          </div>

          {modalError && (
            <p style={{ fontSize: 13, color: '#C41520', margin: 0 }}>{modalError}</p>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" style={{ height: 36, fontSize: 13 }} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ height: 36, fontSize: 13 }} disabled={saving || !isValid}>
              {saving ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
