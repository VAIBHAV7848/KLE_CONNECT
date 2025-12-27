import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Bot, Send, Sparkles, User, Menu, Plus, MessageSquare, Trash2, X, ChevronLeft, Key, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
// Removed GoogleGenerativeAI for security (Step 5)
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
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

  const isNewChatRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Persistence Logic (LocalStorage) ---
  useEffect(() => {
    // Load conversations on mount
    const savedConvos = localStorage.getItem('aitutor-conversations');
    if (savedConvos) {
      setConversations(JSON.parse(savedConvos));
    }
  }, []);

  useEffect(() => {
    // Save conversations when they change
    localStorage.setItem('aitutor-conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    // Load messages when switching conversations
    if (currentConversationId) {
      // If we just created this chat locally, don't overwrite the state from empty storage!
      if (isNewChatRef.current) {
        isNewChatRef.current = false;
        return;
      }

      const savedMessages = localStorage.getItem(`aitutor-messages-${currentConversationId}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    } else {
      // Clear messages if no conversation selected
      if (messages.length > 0) setMessages([]);
    }
  }, [currentConversationId]);

  const saveMessagesToStorage = (chatId: string, newMessages: Message[]) => {
    localStorage.setItem(`aitutor-messages-${chatId}`, JSON.stringify(newMessages));
  };

  // --- Sidebar Actions ---
  const createNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInput('');
  };

  const deleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.removeItem(`aitutor-messages-${id}`);
    if (currentConversationId === id) {
      createNewChat();
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

  // --- Real AI Logic (OpenAI integration) ---
  const generateResponse = async (query: string, chatId: string, history: Message[]) => {
    setIsLoading(true);

    try {
      // Use relative path for Vercel/Production, fallback to env for local dev
      const isProd = import.meta.env.PROD;
      const backendUrl = isProd
        ? "/api/chat"
        : (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api/ai");

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          history: history.slice(0, -1).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now()
      }]);

    } catch (error: any) {
      console.error("BACKEND CALL ERROR:", error);
      let errorMsg = `**AI Connection Error**\n\nUnable to reach the AI server at ${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}. \n\n${error.message}`;

      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
      setMessages(prev => {
        saveMessagesToStorage(chatId, prev);
        return prev;
      });
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
      activeId = generateId();
      isNewChatRef.current = true; // Flag this as a new chat to prevent useEffect overwrite
      const newConvo: Conversation = {
        id: activeId,
        title: userMsgContent.slice(0, 30) + (userMsgContent.length > 30 ? '...' : ''),
        createdAt: timestamp,
      };
      setConversations(prev => [newConvo, ...prev]);
      setCurrentConversationId(activeId);
    }

    // 2. Add User Message
    const newMessage: Message = { role: 'user', content: userMsgContent, timestamp };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    saveMessagesToStorage(activeId, updatedMessages);

    // 3. Trigger AI Response
    await generateResponse(userMsgContent, activeId, updatedMessages);
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

                        {/* Bubble */}
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
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                            {/* Blinking Cursor for active stream */}
                            {isLastAssistantMessage && isLoading && (
                              <span className="cursor-blink"></span>
                            )}
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
                <Send className="w-5 h-5" />
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
