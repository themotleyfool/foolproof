import { useEffect, useRef, useState } from 'react';
import { useEscapeKey } from '../../hooks/use-escape-key';
import type { KnowledgeEntry } from '../../types';
import { inputCls } from '../ui';

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

  useEffect(() => { problemRef.current?.focus(); }, []);
  useEscapeKey(onClose);

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
    <div className="fixed inset-0 bg-[rgba(2,10,56,0.45)] z-[100] flex items-center justify-center p-6 animate-fade-in-up" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-modal max-w-[560px] w-full p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div>
          <p id="modal-title" className="text-[11px] font-bold text-content-36 uppercase tracking-[0.06em] m-0">
            Edit &amp; Verify
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[13px] font-bold text-fg-strong mb-[6px]" htmlFor="modal-problem">Problem</label>
            <textarea
              id="modal-problem"
              ref={problemRef}
              className={`${inputCls} min-h-[72px] resize-y leading-[1.6]`}
              value={problem}
              onChange={e => setProblem(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-fg-strong mb-[6px]" htmlFor="modal-solution">Solution</label>
            <textarea
              id="modal-solution"
              className={`${inputCls} min-h-[140px] resize-y leading-[1.6]`}
              value={solution}
              onChange={e => setSolution(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-fg-strong mb-[6px]" htmlFor="modal-verifier">Your name</label>
            <input
              id="modal-verifier"
              className={inputCls}
              value={verifierName}
              onChange={e => setVerifierName(e.target.value)}
              placeholder="e.g. Jane Smith"
              autoComplete="name"
            />
          </div>

          {modalError && (
            <p className="text-[13px] text-[#C41520] m-0">{modalError}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="h-9 px-3 rounded-[8px] border border-primary-24 bg-white text-[13px] font-bold text-primary-100 cursor-pointer inline-flex items-center outline-none transition-colors duration-[120ms] hover:bg-primary-8 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-3 rounded-[8px] border-0 bg-primary-100 text-[13px] font-bold text-white cursor-pointer inline-flex items-center outline-none transition-colors duration-[120ms] hover:bg-primary-120 disabled:bg-primary-24 disabled:cursor-not-allowed"
              disabled={saving || !isValid}
            >
              {saving ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
