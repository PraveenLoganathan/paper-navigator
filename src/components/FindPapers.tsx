import { useState } from 'react';
import { Paper } from '@/types/paper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, ChevronDown, ChevronUp, Download, Lock, CheckCircle2, Plus, AlertTriangle, Sparkles } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface FindPapersProps {
  searchResults: Paper[];
  libraryPmids: Set<string>;
  onAddPaper: (paper: Paper) => void;
}

const SUGGESTIONS = [
  'JAK inhibitors in rheumatoid arthritis efficacy',
  'IL-17 pathway psoriatic arthritis treatment',
  'Gut microbiome autoimmune disease mechanisms',
];

export default function FindPapers({ searchResults, libraryPmids, onAddPaper }: FindPapersProps) {
  const [query, setQuery] = useState('');
  const [resultCount, setResultCount] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);
  const [showOptimized, setShowOptimized] = useState(false);
  const [showRewritePrompt, setShowRewritePrompt] = useState(false);
  const [useOptimized, setUseOptimized] = useState(false);
  const [downloadableOnly, setDownloadableOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'oldest' | 'availability'>('relevance');

  // DOI upload state
  const [doiText, setDoiText] = useState('');
  const [doiResults, setDoiResults] = useState<{ doi: string; status: string }[] | null>(null);

  const optimizedQuery = query ? `("${query.split(' ').slice(0, 3).join('" AND "')}"[MeSH Terms]) AND ("therapy"[Subheading] OR "treatment outcome"[MeSH Terms])` : '';

  const handleSearch = () => {
    if (!query.trim()) return;
    setHasSearched(true);
    setShowRewritePrompt(false);
    setCurrentPage(1);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val.length > 15) setShowRewritePrompt(true);
    else setShowRewritePrompt(false);
  };

  const filtered = hasSearched
    ? searchResults.filter(p => !downloadableOnly || p.availability === 'available')
    : [];

  const results = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return b.year - a.year;
    if (sortBy === 'oldest') return a.year - b.year;
    if (sortBy === 'availability') {
      const order = { available: 0, preprint: 1, requires_access: 2 };
      return (order[a.availability ?? 'requires_access'] ?? 2) - (order[b.availability ?? 'requires_access'] ?? 2);
    }
    return 0;
  });

  const ITEMS_PER_PAGE = resultCount;
  const totalPages = Math.max(1, Math.ceil(results.length / ITEMS_PER_PAGE));
  const paginatedResults = results.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const downloadableCount = searchResults.filter(p => p.availability === 'available').length;

  const handleDoiSubmit = () => {
    const dois = doiText.split('\n').map(d => d.trim()).filter(Boolean);
    setDoiResults(dois.map((doi, i) => ({
      doi,
      status: i % 4 === 0 ? 'queued' : i % 4 === 1 ? 'queued' : i % 4 === 2 ? 'no_pdf' : 'failed',
    })));
  };

  const availBadge = (p: Paper) => {
    if (p.availability === 'available') return <Badge variant="success" className="gap-1 text-[10px]"><Download className="h-3 w-3" />Available to ingest</Badge>;
    if (p.availability === 'preprint') return <Badge variant="warning" className="gap-1 text-[10px]">Preprint</Badge>;
    return <Badge variant="secondary" className="gap-1 text-[10px]"><Lock className="h-3 w-3" />Requires access</Badge>;
  };

  return (
    <Tabs defaultValue="search" className="space-y-4">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="search">Search</TabsTrigger>
        <TabsTrigger value="doi">Upload DOI list</TabsTrigger>
      </TabsList>

      <TabsContent value="search" className="space-y-4">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search PubMed..."
              className="pl-9"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            className="rounded-md border border-input bg-background px-2 text-sm"
            value={resultCount}
            onChange={e => setResultCount(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        {/* Suggestion chips */}
        {!hasSearched && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); setShowRewritePrompt(true); }}
                className="px-3 py-1.5 text-xs rounded-full bg-secondary text-secondary-foreground hover:bg-primary/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Query rewrite prompt */}
        {showRewritePrompt && !hasSearched && (
          <Card className="p-3 border-primary/20 bg-primary/5 animate-slide-in">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm">Want to use an <strong>AI-optimised PubMed query</strong> with MeSH terms & boolean operators?</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { setUseOptimized(true); handleSearch(); }}>Use optimised query</Button>
                  <Button size="sm" variant="outline" onClick={() => { setUseOptimized(false); handleSearch(); }}>Plain search</Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Optimized query display */}
        {hasSearched && useOptimized && (
          <button
            onClick={() => setShowOptimized(!showOptimized)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showOptimized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            PubMed query used
          </button>
        )}
        {showOptimized && (
          <pre className="text-xs font-mono bg-muted p-3 rounded-lg overflow-x-auto animate-slide-in">{optimizedQuery}</pre>
        )}

        {/* Results toolbar */}
        {hasSearched && (
          <>
            <div className="flex items-center justify-between text-sm flex-wrap gap-2">
              <span className="text-muted-foreground">
                <strong>{results.length}</strong> results · <strong>{downloadableCount}</strong> downloadable
              </span>
              <div className="flex items-center gap-3">
                <select
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                  value={sortBy}
                  onChange={e => { setSortBy(e.target.value as typeof sortBy); setCurrentPage(1); }}
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="newest">Sort: Newest first</option>
                  <option value="oldest">Sort: Oldest first</option>
                  <option value="availability">Sort: Availability</option>
                </select>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={downloadableOnly}
                    onChange={e => { setDownloadableOnly(e.target.checked); setCurrentPage(1); }}
                    className="rounded border-input"
                  />
                  Show downloadable only
                </label>
              </div>
            </div>
            <div className="space-y-2">
              {paginatedResults.map(paper => {
                const inLibrary = libraryPmids.has(paper.pmid);
                return (
                  <Card key={paper.id} className="p-4 animate-slide-in">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {availBadge(paper)}
                        {inLibrary && <Badge variant="default" className="text-[10px]">In library</Badge>}
                      </div>
                      <h3 className="font-semibold text-sm leading-tight">{paper.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {paper.authors} · <span className="italic">{paper.journal}</span> · {paper.year}
                        <span className="font-mono ml-1">PMID: {paper.pmid}</span>
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {paper.abstract.length > 220 ? paper.abstract.slice(0, 220) + '…' : paper.abstract}
                      </p>
                      {paper.licence && (
                        <p className="text-[10px] text-muted-foreground">Licence: {paper.licence}</p>
                      )}
                      <div className="flex justify-end">
                        {paper.availability === 'requires_access' ? null : inLibrary ? (
                          <Button size="sm" variant="outline" disabled className="gap-1"><CheckCircle2 className="h-3 w-3" />Added</Button>
                        ) : (
                          <Button size="sm" className="gap-1 bg-success hover:bg-success/90 text-success-foreground" onClick={() => onAddPaper(paper)}>
                            <Plus className="h-3 w-3" />Ingest
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    if (page === 2 && currentPage > 3) return <PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>;
                    if (page === totalPages - 1 && currentPage < totalPages - 2) return <PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>;
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="doi" className="space-y-4">
        <Textarea
          placeholder="Paste DOIs, one per line:&#10;10.1038/s41586-024-07234-5&#10;10.1016/S0140-6736(24)00234-5"
          rows={6}
          value={doiText}
          onChange={e => setDoiText(e.target.value)}
        />
        <Button onClick={handleDoiSubmit} disabled={!doiText.trim()}>Validate & Ingest</Button>

        {doiResults && (
          <div className="space-y-3 animate-slide-in">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Submitted', value: doiResults.length },
                { label: 'Queued', value: doiResults.filter(d => d.status === 'queued').length },
                { label: 'No PDF', value: doiResults.filter(d => d.status === 'no_pdf').length },
                { label: 'Failed', value: doiResults.filter(d => d.status === 'failed').length },
              ].map(s => (
                <Card key={s.label} className="p-2 text-center">
                  <div className="text-lg font-bold">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </Card>
              ))}
            </div>
            <div className="space-y-1">
              {doiResults.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-border last:border-0">
                  <span className="font-mono flex-1 truncate">{d.doi}</span>
                  <Badge variant={d.status === 'queued' ? 'info' as any : d.status === 'no_pdf' ? 'warning' : 'destructive'}>
                    {d.status === 'queued' ? 'Queued' : d.status === 'no_pdf' ? 'No PDF' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
