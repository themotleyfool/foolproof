import { useState } from 'react';
import type { ApiError } from '../types';

/**
 * Generic hook for making typed API requests with loading and error state.
 * @param url - The API endpoint URL to send requests to.
 * @param method - The HTTP method to use (default: 'POST').
 * @returns An object with `execute`, `data`, `loading`, `error`, and `reset`.
 */
export function useApi<TResponse, TBody = unknown>(
  url: string,
  method: 'GET' | 'POST' | 'DELETE' = 'POST'
) {
  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sends a request to the configured endpoint and updates state with the result.
   * @param body - Optional request body, serialized as JSON.
   * @returns The parsed response on success, or null on failure.
   */
  async function execute(body?: TBody): Promise<TResponse | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const json = (await res.json()) as TResponse | ApiError;
      if (!res.ok) {
        setError((json as ApiError).error ?? 'Request failed');
        return null;
      }
      setData(json as TResponse);
      return json as TResponse;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      return null;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Resets data, error, and loading state back to their initial values.
   */
  function reset() {
    setData(null);
    setError(null);
    setLoading(false);
  }

  return { execute, data, loading, error, reset };
}
