import { useState, useMemo } from 'react';
import { Paper, PaperStatus } from '@/types/paper';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, RefreshCw, AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';

interface MyLibraryProps {
  papers: Paper[];
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
    'Europe PMC': 'bg-info/10 text-info border-info/20',
    'Unpaywall': 'bg-success/10 text-success border-success/20',
    'bioRxiv': 'bg-warning/10 text-warning border-warning/20',
    'medRxiv': 'bg-processing/10 text-processing border-processing/20',
  };
  return colors[source] || '';
};

type FilterTab = 'all' | 'active' | 'ready' | 'needs_review';

export default function MyLibrary({ papers, stats }: MyLibraryProps) {
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');

  const isProcessing = stats.processing > 0;

  const filtered = useMemo(() => {
    let list = [...papers];
    // Filter tab
    if (tab === 'active') list = list.filter(p => p.status === 'processing' || p.status === 'queued');
    else if (tab === 'ready') list = list.filter(p => p.status === 'ingested');
    else if (tab === 'needs_review') list = list.filter(p => p.status === 'failed' || p.status === 'not_found');
    // Text filter
    if (filter) {
      const q = filter.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q) ||
        p.journal.toLowerCase().includes(q) ||
        p.doi.toLowerCase().includes(q) ||
        p.pmid.includes(q)
      );
    }
    // Sort
    list.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    return list;
  }, [papers, filter, tab]);

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: papers.length },
    { key: 'active', label: 'Active', count: papers.filter(p => p.status === 'processing' || p.status === 'queued').length },
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
          placeholder="Search by title, author, journal, DOI..."
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

      {/* Paper cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No papers match your filters.
          </div>
        )}
        {filtered.map(paper => {
          const sb = statusBadge(paper.status);
          const sideLabel = paper.status === 'ingested' ? 'Ready' : paper.status === 'processing' || paper.status === 'queued' ? 'In progress' : 'Needs review';
          const sideColor = paper.status === 'ingested' ? 'text-success' : paper.status === 'processing' || paper.status === 'queued' ? 'text-processing' : 'text-destructive';
          return (
            <Card key={paper.id} className="p-4 hover:shadow-md transition-shadow animate-slide-in">
              <div className="flex gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Badge row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={sb.variant} className="gap-1">{sb.icon}{sb.label}</Badge>
                    {paper.pdfSource && (
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${sourceBadge(paper.pdfSource)}`}>
                        {paper.pdfSource}
                      </span>
                    )}
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">PMID: {paper.pmid}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-tight">{paper.title}</h3>

                  {/* Status note */}
                  {paper.statusNote && (
                    <p className="text-xs text-muted-foreground italic">{paper.statusNote}</p>
                  )}

                  {/* Meta */}
                  <p className="text-xs text-muted-foreground">
                    {paper.authors} · <span className="italic">{paper.journal}</span> · {paper.year}
                    {paper.doi && (
                      <> · <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{paper.doi}</a></>
                    )}
                  </p>

                  {/* Abstract */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {paper.abstract.length > 220 ? paper.abstract.slice(0, 220) + '…' : paper.abstract}
                  </p>
                </div>

                {/* Side column */}
                <div className="flex-shrink-0 text-right space-y-1 w-28">
                  <div className={`text-xs font-semibold ${sideColor}`}>{sideLabel}</div>
                  <div className="text-xs text-muted-foreground">{paper.dateAdded}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
