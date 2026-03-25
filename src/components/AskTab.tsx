import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/paper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookOpen, Send, Trash2, AlertTriangle } from 'lucide-react';

interface AskTabProps {
  messages: ChatMessage[];
  onSend: (content: string) => void;
  readyCount: number;
}

const STARTERS = [
  'What are the latest findings on IL-6 signaling in RA?',
  'Compare JAK inhibitor efficacy across autoimmune conditions',
  'Summarize CRISPR-based approaches to treating RA',
];

function ThinkingDots() {
  return (
    <div className="flex gap-1 py-2">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-primary animate-pulse-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

export default function AskTab({ messages, onSend, readyCount }: AskTabProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const isThinking = messages.length > 0 && messages[messages.length - 1].role === 'user';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40" />
            {readyCount > 0 ? (
              <p className="text-muted-foreground text-sm">
                <strong>{readyCount}</strong> papers ready. Ask anything about your library.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Add papers to your library first, then ask questions here.
              </p>
            )}
            <div className="flex flex-col gap-2 w-full max-w-md">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="text-left px-4 py-3 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
          >
            <div className={`max-w-[80%] space-y-1.5 ${msg.role === 'user' ? '' : ''}`}>
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {msg.role === 'user' ? 'You' : 'Assistant'}
                {msg.sourceCount && <span className="ml-1 normal-case">· {msg.sourceCount} sources</span>}
              </div>
              <Card className={`p-3 ${
                msg.isError
                  ? 'border-destructive/30 bg-destructive/5'
                  : msg.role === 'user'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card'
              }`}>
                {msg.isError && <AlertTriangle className="h-4 w-4 text-destructive mb-1" />}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </Card>
              {msg.rewrittenQuery && (
                <p className="text-[10px] text-muted-foreground italic">Rewritten: {msg.rewrittenQuery}</p>
              )}
              {msg.citations && msg.citations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {msg.citations.map((c, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Assistant</div>
              <Card className="p-3 bg-card"><ThinkingDots /></Card>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border pt-3 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={readyCount > 0 ? 'Ask about your papers…' : 'Add papers to get started…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={readyCount === 0}
        />
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={() => window.location.reload()} title="Clear chat">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button onClick={handleSend} disabled={!input.trim() || readyCount === 0} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
