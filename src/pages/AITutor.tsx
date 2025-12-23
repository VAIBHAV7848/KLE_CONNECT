import { useState, useRef, useEffect, FC, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Bot, Send, Sparkles, User, GraduationCap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';

declare module 'react-markdown' {
  export interface ReactMarkdownProps {
    children?: ReactNode;
  }
}
// Mock typing animation configuration
const TYPING_SPEED = { min: 5, max: 10 }; // milliseconds per character
const NETWORK_DELAY = 800; // milliseconds
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * AI Tutor - Premium conversational interface with mock streaming for demo
 */
const AITutor = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Simulated AI Response Generator (Mock Streaming)
  const generateResponse = async (query: string) => {
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    let responseText = "I can help you with that! As an **AI Tutor**, I can explain complex concepts, solve problems, or create study plans for you. \n\nHere is a quick overview:\n1. **Concept Clarity**: I can break down large topics.\n2. **Practice**: Ask me for quiz questions.\n3. **Planning**: I can help structure your revision.\n\nWhat specifically would you like to work on right now?";

    // Simple context-aware responses (Mock Logic)
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('binary')) {
      responseText = "### Binary Search Trees (BST)\n\n**Binary Search Trees** are a fundamental data structure. \n\nIn a BST:\n- The **left child** is always *smaller* than the parent.\n- The **right child** is always *larger*.\n\n```javascript\n// Simple Node Structure\nclass Node {\n  constructor(value) {\n    this.value = value;\n    this.left = null;\n    this.right = null;\n  }\n}\n```\n\nThis property makes searching very efficient - **O(log n)** average case. Would you like to see a traversal example?";
    } else if (lowerQuery.includes('tcp') || lowerQuery.includes('ip')) {
      responseText = "### TCP/IP Protocol Suite\n\n**TCP/IP** is the backbone of the internet.\n\n* **TCP (Transmission Control Protocol)**: Ensures reliable transmission. It breaks data into packets and reassembles them.\n* **IP (Internet Protocol)**: Handles addressing and routing packets to the correct destination.\n\nTogether, they specify how data should be packetized, addressed, transmitted, routed, and received.";
    } else if (lowerQuery.includes('big o')) {
      responseText = "### Big O Notation\n\n**Big O Notation** describes algorothmic complexity.\n\n| Notation | Name | Speed |\n|----------|------|-------|\n| **O(1)** | Constant | ⚡ Fast |\n| **O(log n)** | Logarithmic | 🚀 Good |\n| **O(n)** | Linear | 🚶 Fair |\n| **O(n²)** | Quadratic | 🐢 Slow |\n\nIt helps us estimate scalability.";
    }

    // Stream the response character by character
    setIsLoading(false);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    let currentText = '';
    const chars = responseText.split('');

    // Faster typing for code blocks
    for (let i = 0; i < chars.length; i++) {
      const delay = Math.random() * 10 + 5;
      await new Promise(resolve => setTimeout(resolve, delay));
      currentText += chars[i];
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: currentText };
        return updated;
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();

    // Add User Message
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');

    // Trigger AI Response
    await generateResponse(userMsg);
  };

  const suggestions = [
    "Explain Binary Search Trees",
    "What is Big O notation?",
    "Generate a study plan for DBMS",
    "Quiz me on Operating Systems"
  ];

  return (
    <PageLayout>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <PageHeader
          icon={Bot}
          title="AI Tutor"
          subtitle="Your personal 24/7 study companion"
          gradient="linear-gradient(135deg, hsl(263 70% 58% / 0.3), hsl(263 70% 58% / 0.1))"
        />

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col glass rounded-2xl relative">

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 ? (
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
                        // Optional: auto-send
                        // handleSend();
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
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`min-w-8 w-8 h-8 rounded-full flex items-center justify-center mt-1 border ${msg.role === 'user'
                        ? 'bg-primary/20 border-primary/30'
                        : 'bg-indigo-500/20 border-indigo-500/30'
                        }`}>
                        {msg.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-indigo-500" />}
                      </div>

                      {/* Bubble */}
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden ${msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'glass-card border border-border/50 rounded-tl-none'
                        }`}>
                        <div
                          className={`prose prose-sm max-w-none ${msg.role === 'user'
                            ? 'prose-invert'
                            : 'dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground'
                            }`}
                        >
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="min-w-8 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mt-1">
                        <Bot className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="glass-card border border-border/50 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </motion.div>
                )}
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
