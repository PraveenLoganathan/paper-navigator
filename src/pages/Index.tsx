import { useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePaperStore } from '@/hooks/usePaperStore';
import MyLibrary from '@/components/MyLibrary';
import FindPapers from '@/components/FindPapers';
import AskTab from '@/components/AskTab';
import { BookOpen, Search, MessageCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';

const Index = () => {
  const { documents, stats, backendHealth, chatMessages, addPaperFromSearch, sendMessage, searchPapers } = usePaperStore();
  const libraryPmids = useMemo(() => new Set(documents.map(d => d.pmid).filter((p): p is string => !!p)), [documents]);

  const healthPill = () => {
    if (backendHealth === 'ready') return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
        <Wifi className="h-3 w-3" />Ready
      </span>
    );
    if (backendHealth === 'connecting') return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
        <Loader2 className="h-3 w-3 animate-spin" />Connecting
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
        <WifiOff className="h-3 w-3" />Unreachable
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Dr Pankti's RA</h1>
            <p className="text-xs text-muted-foreground">Research Assistant</p>
          </div>
          {healthPill()}
        </div>
      </header>

      <div className="container max-w-5xl mx-auto px-4 py-4">
        <Tabs defaultValue="library">
          <TabsList className="w-full justify-start bg-muted/50">
            <TabsTrigger value="library" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              My library
              {stats.ready > 0 && (
                <span className="ml-1 bg-success text-success-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {stats.ready}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="find" className="gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Find papers
            </TabsTrigger>
            <TabsTrigger value="ask" className="gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              Ask
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            <MyLibrary documents={documents} stats={stats} />
          </TabsContent>

          <TabsContent value="find">
            <FindPapers searchResults={searchPapers} libraryPmids={libraryPmids} onAddPaper={addPaperFromSearch} />
          </TabsContent>

          <TabsContent value="ask">
            <AskTab messages={chatMessages} onSend={sendMessage} readyCount={stats.ready} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
