import type {
  KnowledgeEntry,
  LookupRequest,
  LookupResponse,
  RefreshEntryResponse,
  ScanProgressEvent,
  ScanRequest,
  ScanResponse,
} from '../types';

export interface KbChannelsResponse {
  channels: string[];
}

export interface KbEntriesResponse {
  entries: KnowledgeEntry[];
  total: number;
}

export interface HeaderStats {
  entriesCount: number;
  channelsCount: number;
}

export interface PatchEntryData {
  problem: string;
  solution: string;
  verifiedBy: string;
}

/**
 * Sends a fetch request and returns the parsed JSON body, throwing on non-OK responses.
 * @param url - The request URL.
 * @param options - Optional fetch init options.
 * @returns The parsed response body.
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? 'Request failed');
  }
  return json as T;
}

/**
 * Fetches the list of channels that have a knowledge base.
 * @returns Object containing an array of channel name strings.
 */
export async function fetchChannels(): Promise<KbChannelsResponse> {
  return apiFetch<KbChannelsResponse>('/api/knowledge');
}

/**
 * Fetches knowledge base entries for a channel with optional tag and text filters.
 * @param channel - The channel name.
 * @param tag - Tag filter; pass empty string to skip.
 * @param q - Text search query; pass empty string to skip.
 * @returns The entries and total count for the channel.
 */
export async function fetchEntries(channel: string, tag = '', q = ''): Promise<KbEntriesResponse> {
  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (q) params.set('q', q);
  const qs = params.toString();
  return apiFetch<KbEntriesResponse>(`/api/knowledge/${channel}${qs ? `?${qs}` : ''}`);
}

/**
 * Deletes a knowledge base entry by ID.
 * @param channel - The channel the entry belongs to.
 * @param id - The entry ID to delete.
 */
export async function deleteEntry(channel: string, id: string): Promise<void> {
  await apiFetch<unknown>(`/api/knowledge/${channel}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/**
 * Updates a knowledge base entry with verified problem/solution data.
 * @param channel - The channel the entry belongs to.
 * @param id - The entry ID to patch.
 * @param data - The updated problem, solution, and verifier name.
 */
export async function patchEntry(
  channel: string,
  id: string,
  data: PatchEntryData
): Promise<void> {
  await apiFetch<unknown>(`/api/knowledge/${channel}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Initiates a channel scan and streams progress events via SSE.
 * Calls `onProgress` for each progress event and resolves with the final ScanResponse.
 * Pre-flight errors (bad input, duplicate scan) reject immediately with a thrown Error
 * before any progress events are fired.
 * @param body - The scan request payload with channelId and optional date range.
 * @param onProgress - Callback invoked for each progress event from the server.
 * @param signal - Optional AbortSignal to cancel the in-flight stream.
 * @returns The final scan result when the stream completes successfully.
 */
export async function streamScan(
  body: ScanRequest,
  onProgress: (event: ScanProgressEvent) => void,
  signal?: AbortSignal,
): Promise<ScanResponse> {
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  // Pre-flight errors (400, 409, etc.) are still plain JSON
  if (!res.ok) {
    const json = await res.json() as { error?: string };
    throw new Error(json.error ?? 'Scan failed');
  }

  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    // SSE events are separated by double newlines
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      let type = '';
      let data = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event: ')) type = line.slice(7).trim();
        else if (line.startsWith('data: ')) data = line.slice(6).trim();
      }
      if (!type || !data) continue;
      const parsed = JSON.parse(data) as Record<string, unknown>;
      if (type === 'progress') {
        onProgress(parsed as ScanProgressEvent);
      } else if (type === 'done') {
        return parsed as ScanResponse;
      } else if (type === 'error') {
        throw new Error(String(parsed.error ?? 'Scan failed'));
      }
    }
  }

  throw new Error('Scan stream ended unexpectedly');
}

/**
 * Looks up a Slack thread by URL and returns an AI-suggested solution.
 * @param body - The lookup request with the Slack permalink URL.
 * @returns Thread context, suggested solution, and related entries.
 */
export async function lookupThread(body: LookupRequest): Promise<LookupResponse> {
  return apiFetch<LookupResponse>('/api/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Re-fetches the original Slack thread for an entry and re-extracts knowledge via LLM.
 * Clears any prior verification stamp since the content may have changed.
 * @param channel - The channel the entry belongs to.
 * @param id - The entry ID to refresh.
 * @returns The updated knowledge entry.
 */
export async function refreshEntry(channel: string, id: string): Promise<RefreshEntryResponse> {
  return apiFetch<RefreshEntryResponse>(
    `/api/knowledge/${channel}/${encodeURIComponent(id)}/refresh`,
    { method: 'POST' }
  );
}

/**
 * Fetches aggregated stats from the server's stats endpoint.
 * @returns Object with total entry count and channel count.
 */
export async function fetchStats(): Promise<HeaderStats> {
  return apiFetch<HeaderStats>('/api/knowledge/stats');
}
