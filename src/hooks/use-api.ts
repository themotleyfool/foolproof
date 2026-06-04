import { useState } from 'react';
import type { ApiError } from '../types';

export function useApi<TResponse, TBody = unknown>(
  url: string,
  method: 'GET' | 'POST' | 'DELETE' = 'POST'
) {
  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function reset() {
    setData(null);
    setError(null);
    setLoading(false);
  }

  return { execute, data, loading, error, reset };
}
