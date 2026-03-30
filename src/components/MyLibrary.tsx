import { useState, useMemo } from 'react';
import { LibraryDocument, PaperStatus } from '@/types/paper';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, RefreshCw, AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';

interface MyLibraryProps {
  documents: LibraryDocument[];
  stats: { total: number; ready: number; processing: number; needRetry: number };
}

const STATUS_ORDER: Record<PaperStatus, number> = {
  processing: 0, queued: 1, failed: 2, ingested: 3, not_found: 4,
};

const statusBadge = (status: PaperStatus) => {
  const map: Record<PaperStatus, { variant: 'success' | 'processing' | 'warning' | 'destructive' | 'secondary'; label: string; icon: React.ReactNode }> = {
    ingested: { variant: 'success', label: 'Ingested', icon: <CheckCircle2 className="h-3 w-3" /> },
    processing: { variant: 'processing', label: 'Processing', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    queued: { variant: 'info' as any, label: 'Queued', icon: <Clock className="h-3 w-3" /> },
    failed: { variant: 'destructive', label: 'Failed', icon: <AlertTriangle className="h-3 w-3" /> },
    not_found: { variant: 'secondary', label: 'Not Found', icon: <XCircle className="h-3 w-3" /> },
  };
  return map[status];
};

const sourceBadge = (source?: string) => {
  if (!source) return null;
  const colors: Record<string, string> = {
    'europe_pmc': 'bg-info/10 text-info border-info/20',
    'unpaywall': 'bg-success/10 text-success border-success/20',
    'biorxiv': 'bg-warning/10 text-warning border-warning/20',
    'medrxiv': 'bg-processing/10 text-processing border-processing/20',
  };
  return colors[source] || '';
};

const sourceLabel = (source?: string) => {
  if (!source) return null;
  const labels: Record<string, string> = {
    'europe_pmc': 'Europe PMC',
    'unpaywall': 'Unpaywall',
    'biorxiv': 'bioRxiv',
    'medrxiv': 'medRxiv',
  };
  return labels[source] || source;
};

type FilterTab = 'all' | 'active' | 'ready' | 'needs_review';

export default function MyLibrary({ documents, stats }: MyLibraryProps) {
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');

  const isProcessing = stats.processing > 0;

  const filtered = useMemo(() => {
    let list = [...documents];
    if (tab === 'active') list = list.filter(d => d.status === 'processing' || d.status === 'queued');
    else if (tab === 'ready') list = list.filter(d => d.status === 'ingested');
    else if (tab === 'needs_review') list = list.filter(d => d.status === 'failed' || d.status === 'not_found');
    if (filter) {
      const q = filter.toLowerCase();
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        (d.journal?.toLowerCase().includes(q)) ||
        (d.doi?.toLowerCase().includes(q)) ||
        (d.pmid?.includes(q)) ||
        (d.doc_id.includes(q))
      );
    }
    list.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    return list;
  }, [documents, filter, tab]);

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: documents.length },
    { key: 'active', label: 'Active', count: documents.filter(d => d.status === 'processing' || d.status === 'queued').length },
    { key: 'ready', label: 'Ready', count: stats.ready },
    { key: 'needs_review', label: 'Needs review', count: stats.needRetry },
  ];

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total added', value: stats.total, color: 'text-foreground' },
          { label: 'Ready to ask', value: stats.ready, color: 'text-success' },
          { label: 'Processing', value: stats.processing, color: 'text-processing' },
          { label: 'Need retry', value: stats.needRetry, color: 'text-destructive' },
        ].map(s => (
          <Card key={s.label} className="p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Processing banner */}
      {isProcessing && (
        <div className="flex items-center gap-2 rounded-lg bg-processing/10 border border-processing/20 px-4 py-2.5 text-sm animate-slide-in">
          <RefreshCw className="h-4 w-4 text-processing animate-spin" />
          <span className="text-processing font-medium">{stats.processing} paper{stats.processing > 1 ? 's' : ''} indexing — auto-refreshing every 10s</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, journal, DOI, doc_id..."
          className="pl-9"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Document cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No papers match your filters.
          </div>
        )}
        {filtered.map(doc => {
          const sb = statusBadge(doc.status);
          const sideLabel = doc.status === 'ingested' ? 'Ready' : doc.status === 'processing' || doc.status === 'queued' ? 'In progress' : 'Needs review';
          const sideColor = doc.status === 'ingested' ? 'text-success' : doc.status === 'processing' || doc.status === 'queued' ? 'text-processing' : 'text-destructive';
          const ingestedDate = doc.ingested_at ? new Date(doc.ingested_at).toLocaleDateString() : '';
          return (
            <Card key={doc.doc_id} className="p-4 hover:shadow-md transition-shadow animate-slide-in">
              <div className="flex gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Badge row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={sb.variant} className="gap-1">{sb.icon}{sb.label}</Badge>
                    {doc.pdf_source && (
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${sourceBadge(doc.pdf_source)}`}>
                        {sourceLabel(doc.pdf_source)}
                      </span>
                    )}
                    {doc.pmid && <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">PMID: {doc.pmid}</span>}
                    {doc.verified && <Badge variant="success" className="text-[10px]">Verified</Badge>}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-tight">{doc.title}</h3>

                  {/* Meta */}
                  <p className="text-xs text-muted-foreground">
                    {doc.journal && <><span className="italic">{doc.journal}</span> · </>}
                    {doc.pub_year}
                    {doc.doi && (
                      <> · <a href={`https://doi.org/${doc.doi}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{doc.doi}</a></>
                    )}
                  </p>

                  {/* Chunk/page info for ingested docs */}
                  {doc.status === 'ingested' && (doc.page_count || doc.chunk_count) && (
                    <p className="text-[10px] text-muted-foreground">
                      {doc.page_count && <>{doc.page_count} pages</>}
                      {doc.page_count && doc.chunk_count && <> · </>}
                      {doc.chunk_count && <>{doc.chunk_count} chunks</>}
                    </p>
                  )}
                </div>

                {/* Side column */}
                <div className="flex-shrink-0 text-right space-y-1 w-28">
                  <div className={`text-xs font-semibold ${sideColor}`}>{sideLabel}</div>
                  <div className="text-xs text-muted-foreground">{ingestedDate}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
