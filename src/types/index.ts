export interface SlackMessage {
  ts: string;
  user: string;
  userName?: string;
  text: string;
  thread_ts?: string;
  reply_count?: number;
}

export interface SlackThread {
  parentMessage: SlackMessage;
  replies: SlackMessage[];
  channelId: string;
  channelName: string;
}

export interface KnowledgeEntry {
  id: string;
  channelId: string;
  channelName: string;
  threadTs: string;
  scannedAt: string;
  problem: string;
  solution: string;
  rawMessages: SlackMessage[];
  tags: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface KnowledgeBase {
  version: 1;
  lastUpdated: string;
  entries: KnowledgeEntry[];
}

export interface ScanRequest {
  channelId: string;
  startDate?: string; // ISO 8601 date string, e.g. "2024-03-01"
}

export interface ScanResponse {
  channelId: string;
  channelName: string;
  threadsScanned: number;
  entriesAdded: number;
  entriesSkipped: number;
  durationMs: number;
}

export interface LookupRequest {
  slackUrl: string;
}

export interface LookupResponse {
  thread: SlackThread;
  suggestedSolution: string;
  relatedEntries: KnowledgeEntry[];
}

export interface ApiError {
  error: string;
  details?: string;
}
