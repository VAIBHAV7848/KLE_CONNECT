import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Bot, Send, Sparkles, User, Menu, Plus, MessageSquare, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
// Removed GoogleGenerativeAI for security (Step 5)
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

// Mock typing animation configuration
const TYPING_SPEED = { min: 5, max: 10 }; // milliseconds per character
const NETWORK_DELAY = 800; // milliseconds

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  provider?: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
}

/**
 * AI Tutor - Premium conversational interface with mock streaming for demo
 */
const AITutor = () => {
  // --- State Management ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'error'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  // Dynamic AI Endpoint: Use environment variable for local dev, fallback to relative for production
  // This allows local testing against deployed backend while keeping relative paths in production
  const aiEndpoint = import.meta.env.VITE_AI_API_URL || "/api/ai";

  const isNewChatRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

  // --- Persistence Logic (Supabase) ---
  useEffect(() => {
    // Load conversations on mount
    const loadConversations = async () => {
      if (!user?.uid) return;
      try {
        const { data, error } = await supabase
          .from('ai_conversations')
          .select('*')
          .eq('user_id', user.uid)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setConversations(data.map(c => ({
            id: c.id,
            title: c.title || 'New Chat',
            createdAt: new Date(c.created_at).getTime()
          })));
        }
      } catch (err: any) {
        console.error('[AITutor] Load conversations failed:', err);
        toast.error('Could not load chat history');
      }
    };

    loadConversations();

    // Realtime subscription for conversation list
    if (!user?.uid) return;

    const convoChannel = supabase
      .channel(`ai_convos_${user.uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_conversations', filter: `user_id=eq.${user.uid}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const c = payload.new as any;
            setConversations(prev => {
              if (prev.find(conv => conv.id === c.id)) return prev;
              return [{ id: c.id, title: c.title || 'New Chat', createdAt: new Date(c.created_at).getTime() }, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as any;
            setConversations(prev => prev.filter(c => c.id !== old.id));
          } else if (payload.eventType === 'UPDATE') {
            const c = payload.new as any;
            setConversations(prev => prev.map(conv =>
              conv.id === c.id ? { ...conv, title: c.title || conv.title } : conv
            ));
          }
        }
      )
      .subscribe();

    return () => {
      convoChannel.unsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
    // Load messages when switching conversations
    const loadMessages = async () => {
      if (!currentConversationId) {
        setMessages([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', currentConversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          setMessages(data.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.created_at).getTime()
          })));
        }
      } catch (err: any) {
        console.error('[AITutor] Load messages failed:', err);
        toast.error('Could not load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Realtime subscription for messages in the current conversation
    if (!currentConversationId) return;

    const msgChannel = supabase
      .channel(`ai_msgs_${currentConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
          filter: `conversation_id=eq.${currentConversationId}`,
        },
        (payload) => {
          const m = payload.new as any;
          setMessages(prev => {
            // Deduplicate: If message with same content and role exists within 10 seconds, skip
            const isDuplicate = prev.some(msg => 
              msg.content === m.content && 
              msg.role === m.role &&
              Math.abs(msg.timestamp - new Date(m.created_at).getTime()) < 10000 
            );

            if (isDuplicate) return prev;
            
            return [...prev, {
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.created_at).getTime()
            }];
          });
        }
      )
      .subscribe();

    return () => {
      msgChannel.unsubscribe();
    };
  }, [currentConversationId]);

  // --- Sidebar Actions ---
  const createNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInput('');
  };

  const deleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        createNewChat();
      }
      toast.success('Conversation deleted');
    } catch (err: any) {
      console.error('[AITutor] Delete failed:', err);
      toast.error('Delete failed');
    }
  };

  const selectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  // --- Auto-scroll ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // --- Core Logic (Existing MOCK AI + New History) ---

  // --- Real AI Logic (Internal API integration) ---
  const generateResponse = async (query: string, chatId: string, history: Message[]) => {
    console.log("[AITutor] Starting generateResponse for query:", query);
    setIsLoading(true);
    setStatus('requesting');
    setLastError(null);

    try {
      // 1. Get Supabase Session Token
      console.log("[AITutor] Step 1: Retrieving Session Token...");
      let idToken = "";
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          idToken = session.access_token;
          console.log("[AITutor] Session Token retrieved successfully.");
        } else {
          console.warn("[AITutor] No user logged in, sending empty token.");
        }
      } catch (tokenErr) {
        console.error("[AITutor] Token retrieval total failure:", tokenErr);
      }

      // 2. Use configured endpoint (env var for local, relative for production)
      const targetEndpoint = aiEndpoint;
      console.log("[AITutor] Step 2: Fetching from", targetEndpoint);
      const startTime = Date.now();

      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 45000); // Increased to 45s

      try {
        const response = await fetch(targetEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": idToken ? `Bearer ${idToken}` : ""
          },
          signal: controller.signal,
          body: JSON.stringify({
            prompt: query,
            history: history.slice(0, -1).map(m => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.content }],
            }))
          })
        });

        clearTimeout(fetchTimeout);
        console.log(`[AITutor] Server responded with status ${response.status} in ${Date.now() - startTime}ms`);

        let data: any;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error("[AITutor] Expected JSON but received:", text.slice(0, 100));
          throw new Error(`Server returned non-JSON response (${response.status})`);
        }

        if (!response.ok) {
          console.error("[AITutor] FULL BACKEND ERROR RESPONSE:", data);
          const serverError = data.message || data.error || data.reply || `Error ${response.status}`;
          throw new Error(serverError);
        }

        console.log(`[AITutor] AI Message Received. Provider: ${data.provider} | Route: ${data.routeStatus || 'N/A'}`);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          timestamp: Date.now(),
          provider: data.provider
        }]);

        // Save assistant message to Supabase
        await supabase.from('ai_messages').insert({
          conversation_id: chatId,
          role: 'assistant',
          content: data.reply
        });

        setStatus('idle');
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          throw new Error("The AI server took too long to respond (15s timeout). Please try again.");
        }
        throw fetchErr;
      }

    } catch (error: any) {
      console.error("[AITutor] Request flow failed:", error);

      let errorMsg = `**Connection Error**\n\n${error.message}`;

      if (error.message.includes('503')) {
        errorMsg = "**System Maintenance**\n\nThe AI Tutor is currently being updated. Please check back shortly.";
      }

      setLastError(error.message);
      toast.error(error.message.slice(0, 50));
      setStatus('error');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMsg,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    console.log("handleSend triggered with input:", input);
    if (!input.trim() || isLoading) return;
    const userMsgContent = input.trim();
    const timestamp = Date.now();

    // 1. Determine Chat ID (New or Existing)
    let activeId = currentConversationId;

    if (!activeId) {
      const activeTitle = userMsgContent.slice(0, 30) + (userMsgContent.length > 30 ? '...' : '');
      const { data: convo, error: convoErr } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user?.uid,
          title: activeTitle
        })
        .select()
        .single();

      if (convoErr) {
        console.error('[AITutor] Convo creation failed:', convoErr);
        toast.error('Failed to start chat');
        return;
      }
      activeId = convo.id;
      setConversations(prev => [{ id: activeId!, title: activeTitle, createdAt: Date.now() }, ...prev]);
      setCurrentConversationId(activeId);
    }

    // 2. Add User Message
    const newMessage: Message = { role: 'user', content: userMsgContent, timestamp };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');

    // Save user message to Supabase
    await supabase.from('ai_messages').insert({
      conversation_id: activeId,
      role: 'user',
      content: userMsgContent
    });

    // 3. Trigger AI Response
    await generateResponse(userMsgContent, activeId!, updatedMessages);
  };

  const suggestions = [
    "Explain Binary Search Trees",
    "What is Big O notation?",
    "Generate a study plan for DBMS",
    "Quiz me on Operating Systems"
  ];

  // --- Components ---

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-xl border-r border-border/50">
      <div className="p-4">
        <Button
          onClick={createNewChat}
          className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
          variant="ghost"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        {conversations.length === 0 && (
          <div className="text-center text-xs text-muted-foreground p-4">
            No history yet.
          </div>
        )}
        {conversations.map(chat => (
          <div
            key={chat.id}
            onClick={() => selectConversation(chat.id)}
            className={cn(
              "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-muted/50 text-sm",
              currentConversationId === chat.id ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="truncate flex-1 text-left">{chat.title}</span>
            <button
              onClick={(e) => deleteConversation(e, chat.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity p-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <PageLayout>
      <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden">

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 glass rounded-2xl overflow-hidden shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar (Drawer) */}
        <div className="md:hidden absolute top-24 left-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="glass">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 pt-10">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col glass rounded-2xl relative overflow-hidden">
          <div className="p-4 md:p-6 pb-2 md:pb-6">
            <PageHeader
              icon={Bot}
              title="AI TUTOR"
              subtitle="Your personal 24/7 study companion"
              gradient="linear-gradient(135deg, hsl(263 70% 58% / 0.3), hsl(263 70% 58% / 0.1))"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className={cn(
                "px-2 py-1 rounded-lg border text-[11px]",
                status === 'requesting' && "border-yellow-500/40 text-yellow-200 bg-yellow-500/10",
                status === 'error' && "border-red-500/40 text-red-200 bg-red-500/10",
                status === 'idle' && "border-emerald-500/40 text-emerald-200 bg-emerald-500/10"
              )}>
                {status === 'requesting' && 'Contacting AI...'}
                {status === 'idle' && 'Ready'}
                {status === 'error' && 'Error — check logs'}
              </span>
              {lastError && (
                <span className="px-2 py-1 rounded bg-destructive/10 text-destructive text-[11px] truncate max-w-sm" title={lastError}>
                  {lastError}
                </span>
              )}
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {!currentConversationId && messages.length === 0 ? (
              // Empty State
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-80">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-display mb-2">Hello, Student! 👋</h3>
                <p className="text-muted-foreground max-w-sm mb-8">
                  I'm here to help you ace your exams. Ask me about concepts, code, or request a quick quiz!
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setInput(s);
                      }}
                      className="text-sm p-3 rounded-xl bg-muted/50 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all text-left truncate"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  const isLastAssistantMessage = !isUser && index === messages.length - 1;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}
                    >
                      <div className={cn(
                        "flex gap-3 max-w-[85%] md:max-w-[75%]",
                        isUser ? "flex-row-reverse" : "flex-row"
                      )}>
                        {/* Avatar */}
                        <div className={cn(
                          "min-w-8 w-8 h-8 rounded-full flex items-center justify-center mt-1 border shrink-0 shadow-sm",
                          isUser ? "bg-primary/20 border-primary/30" : "bg-indigo-500/20 border-indigo-500/30"
                        )}>
                          {isUser ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-indigo-500" />}
                        </div>

                        {/* Bubble Container */}
                        <div className="flex flex-col gap-1">
                          {/* Label + Provider */}
                          <div className={cn(
                            "flex items-center gap-2 px-1",
                            isUser ? "flex-row-reverse" : "flex-row"
                          )}>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                              {isUser ? 'You' : 'KLE AI Tutor'}
                            </span>
                          </div>

                          {/* Chat Bubble */}
                          <div className={cn(
                            "p-4 rounded-2xl text-sm leading-relaxed shadow-md transition-all hover:shadow-lg",
                            isUser
                              ? "bg-primary text-primary-foreground rounded-tr-none shadow-primary/10"
                              : "ai-bubble-gradient border border-border/50 rounded-tl-none shadow-black/5"
                          )}>
                            <div className={cn(
                              "prose prose-sm max-w-none break-words",
                              isUser ? "prose-invert" : "dark:prose-invert prose-p:text-foreground/90"
                            )}>
                              {/* @ts-ignore - Version mismatch in library types */}
                              <ReactMarkdown
                                {...({
                                  components: {
                                    h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold mb-3 mt-4 text-primary" {...props} />,
                                    h2: ({ node, ...props }: any) => <h2 className="text-lg font-semibold mb-2 mt-3 text-primary" {...props} />,
                                    h3: ({ node, ...props }: any) => <h3 className="text-base font-semibold mb-2 mt-2" {...props} />,
                                    p: ({ node, ...props }: any) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                                    ul: ({ node, ...props }: any) => <ul className="list-disc list-inside mb-3 space-y-1 ml-2" {...props} />,
                                    ol: ({ node, ...props }: any) => <ol className="list-decimal list-inside mb-3 space-y-1 ml-2" {...props} />,
                                    li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
                                    code: ({ node, inline, ...props }: any) =>
                                      inline ? (
                                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary" {...props} />
                                      ) : (
                                        <code className="block bg-muted/50 p-3 rounded-lg my-2 text-xs font-mono overflow-x-auto border border-border/30" {...props} />
                                      ),
                                    blockquote: ({ node, ...props }: any) => (
                                      <blockquote className="border-l-4 border-primary/30 pl-4 italic my-3 text-muted-foreground" {...props} />
                                    ),
                                    a: ({ node, ...props }: any) => (
                                      <a className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
                                    ),
                                    strong: ({ node, ...props }: any) => <strong className="font-bold text-foreground" {...props} />,
                                    em: ({ node, ...props }: any) => <em className="italic" {...props} />,
                                  }
                                } as any)}
                              >
                                {msg.content}
                              </ReactMarkdown>
                              {/* Blinking Cursor for active stream */}
                              {isLastAssistantMessage && isLoading && (
                                <span className="cursor-blink"></span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}


              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border/40 bg-background/50 backdrop-blur-sm">
            <div className="flex gap-3 items-end max-w-4xl mx-auto">
              <div className="relative flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your question..."
                  className="min-h-[50px] max-h-[120px] pr-12 resize-none rounded-xl bg-muted/50 border-input focus:ring-primary/20"
                />
                {input && (
                  <button
                    onClick={() => setInput('')}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-[50px] w-[50px] rounded-xl bg-primary hover:bg-primary/90 shrink-0"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AITutor;
