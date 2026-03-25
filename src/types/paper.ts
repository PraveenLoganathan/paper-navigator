export type PaperStatus = 'ingested' | 'queued' | 'processing' | 'failed' | 'not_found';
export type PdfSource = 'Europe PMC' | 'Unpaywall' | 'bioRxiv' | 'medRxiv';
export type Availability = 'available' | 'preprint' | 'requires_access';

export interface Paper {
  id: string;
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  abstract: string;
  status: PaperStatus;
  statusNote?: string;
  pdfSource?: PdfSource;
  licence?: string;
  availability?: Availability;
  dateAdded: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourceCount?: number;
  rewrittenQuery?: string;
  citations?: string[];
  isError?: boolean;
}

export type BackendHealth = 'connecting' | 'ready' | 'unreachable';
