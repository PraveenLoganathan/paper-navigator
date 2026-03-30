// ── Status & enum types ────────────────────────────────

export type PaperStatus = 'ingested' | 'queued' | 'processing' | 'failed' | 'not_found';
export type Availability = 'available' | 'preprint' | 'requires_access';
export type BackendHealth = 'connecting' | 'ready' | 'unreachable';
export type SortBy = 'best_match' | 'pub_date_desc' | 'pub_date_asc' | 'availability';

// ── /api/papers/search ─────────────────────────────────

export interface SearchPaper {
  pmid: string;
  doi: string;
  pmcid?: string;
  title: string;
  authors: string[];            // array, not joined string
  journal: string;
  year: string;                 // string from API
  published_date?: string;
  abstract: string;
  open_access: boolean;
  pdf_url?: string;
  source?: string;              // e.g. "europe_pmc"
  availability: Availability;
  licence?: string;
  availability_note?: string;
}

export interface SearchResponse {
  query: string;
  pubmed_query: string | null;
  total_found: number;
  filtered_total: number;
  downloadable_total: number;
  downloadable_total_exact: boolean;
  downloadable_scanned: number;
  offset: number;
  limit: number;
  page: number;
  page_size: number;
  returned_count: number;
  total_pages: number;
  has_next_page: boolean;
  has_more: boolean;
  sort_by: string;
  downloadable_only: boolean;
  downloadable_scope: string;
  search_token: string | null;
  results: SearchPaper[];
}

// ── /api/papers/ingest/* ───────────────────────────────

export interface IngestResult {
  identifier: string;
  pmid?: string;
  doi?: string;
  title?: string;
  status: 'queued' | 'not_found' | 'failed';
  blob_name?: string;
  pdf_source?: string;
  error: string | null;
}

export interface IngestResponse {
  submitted: number;
  queued: number;
  not_found: number;
  failed: number;
  results: IngestResult[];
}

// ── /api/query/documents ───────────────────────────────

export interface LibraryDocument {
  doc_id: string;
  blob_url?: string;
  title: string;
  doi?: string;
  pmid?: string;
  journal?: string;
  pub_year?: string;
  published_date?: string;
  pdf_source?: string;
  verified: boolean;
  page_count?: number;
  chunk_count?: number;
  ingested_at: string;
  status: PaperStatus;
}

// ── /api/query/query ───────────────────────────────────

export interface QuerySource {
  citation: string;
  chunk_id: string;
  doc_id: string;
  document_title: string;
  blob_url?: string;
  published_date?: string;
  section?: string;
  page?: number;
  score: number;
  caption?: string;
  excerpt?: string;
}

export interface QueryResponse {
  answer: string;
  original_query: string;
  rewritten_query: string | null;
  sources: QuerySource[];
  evidence: QuerySource[];
}

// ── Chat (local UI state) ──────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: QuerySource[];
  rewritten_query?: string;
  isError?: boolean;
}
