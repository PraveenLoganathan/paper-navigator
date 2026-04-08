import { useEffect, useRef, useState } from 'react';
import { QuerySource } from '@/types/paper';
import { Button } from '@/components/ui/button';
import { X, FileText, ChevronLeft, ChevronRight, ExternalLink, BookOpen } from 'lucide-react';

interface PdfViewerPanelProps {
  source: QuerySource | null;
  onClose: () => void;
}

export default function PdfViewerPanel({ source, onClose }: PdfViewerPanelProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (source?.page) {
      setCurrentPage(source.page);
    }
  }, [source]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!source) return null;

  const pdfUrl = source.blob_url;
  const hasPdf = !!pdfUrl;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border z-50 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{source.document_title}</p>
              <p className="text-[10px] text-muted-foreground">
                {source.citation} · {source.section && `${source.section} · `}Page {source.page || '?'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasPdf && (
              <Button variant="ghost" size="icon" asChild title="Open in new tab">
                <a href={`${pdfUrl}#page=${currentPage}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Page navigation */}
        {hasPdf && (
          <div className="flex items-center justify-center gap-3 px-4 py-2 border-b border-border bg-muted/20">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground">
              Page {currentPage}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {source.page && currentPage !== source.page && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setCurrentPage(source.page!)}
              >
                Go to cited page ({source.page})
              </Button>
            )}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {hasPdf ? (
            <iframe
              key={`${pdfUrl}-${currentPage}`}
              src={`${pdfUrl}#page=${currentPage}`}
              className="w-full h-full border-0"
              title={`PDF: ${source.document_title}`}
            />
          ) : (
            /* Fallback: show excerpt and metadata when no PDF URL */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-6">
              <div className="rounded-full bg-muted p-6">
                <BookOpen className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-base font-semibold">PDF not available yet</h3>
                <p className="text-sm text-muted-foreground">
                  The full PDF for this document isn't loaded. Here's the cited excerpt:
                </p>
              </div>

              {/* Excerpt card */}
              <div className="w-full max-w-md space-y-3">
                {source.excerpt && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-left">
                    <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1.5">
                      Cited excerpt
                    </p>
                    <p className="text-sm leading-relaxed italic">"{source.excerpt}"</p>
                  </div>
                )}
                {source.caption && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                      Caption
                    </p>
                    <p className="text-sm leading-relaxed">{source.caption}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {source.section && (
                    <span className="px-2 py-1 rounded-full bg-muted">§ {source.section}</span>
                  )}
                  {source.page && (
                    <span className="px-2 py-1 rounded-full bg-muted">Page {source.page}</span>
                  )}
                  <span className="px-2 py-1 rounded-full bg-muted">
                    Score: {(source.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
