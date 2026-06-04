import type {
  KnowledgeEntry,
  LookupRequest,
  LookupResponse,
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
 * Scans a Slack channel for threads and extracts knowledge base entries.
 * @param body - The scan request payload with channelId and optional startDate.
 * @returns Scan result statistics.
 */
export async function scanChannel(body: ScanRequest): Promise<ScanResponse> {
  return apiFetch<ScanResponse>('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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
 * Fetches aggregated stats from the server's stats endpoint.
 * @returns Object with total entry count and channel count.
 */
export async function fetchStats(): Promise<HeaderStats> {
  return apiFetch<HeaderStats>('/api/knowledge/stats');
}
