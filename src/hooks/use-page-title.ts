import { useEffect } from 'react';

/**
 * Sets the document title to `{page} | FoolProof` on mount.
 * @param page - The page-specific portion of the title.
 */
export function usePageTitle(page: string): void {
  useEffect(() => {
    document.title = `${page} | FoolProof`;
  }, [page]);
}
