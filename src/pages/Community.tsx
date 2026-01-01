import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { MessageSquare, Hash, Send, Users, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat, Message } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import Avatar from 'boring-avatars';

const CHANNELS = [
    { id: 'general', name: 'General', description: 'General discussion for everyone' },
    { id: 'computer-science', name: 'Computer Science', description: 'Coding queries and discussions' },
    { id: 'events', name: 'Events', description: 'Discuss upcoming college events' },
    { id: 'random', name: 'Random', description: 'Off-topic fun conversations' }
];

const Community = () => {
    const [activeChannel, setActiveChannel] = useState('general');
    const [inputText, setInputText] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const { messages, loading, sendMessage } = useChat(activeChannel);
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;

        await sendMessage(inputText);
        setInputText('');
    };

    return (
        <PageLayout>
            <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 overflow-hidden relative">

                {/* Mobile Sidebar Toggle */}
                <div className="md:hidden mb-2">
                    <Button variant="outline" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <Menu className="w-4 h-4 mr-2" /> Channels
                    </Button>
                </div>

                {/* Sidebar - Channels List */}
                <AnimatePresence mode="wait">
                    {(isSidebarOpen || window.innerWidth >= 768) && (
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className={cn(
                                "w-full md:w-64 glass rounded-2xl flex flex-col overflow-hidden z-20",
                                "absolute md:relative h-full bg-background/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none"
                            )}
                        >
                            <div className="p-4 border-b border-border/10 bg-primary/5">
                                <h2 className="font-semibold flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                    Channels
                                </h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {CHANNELS.map(channel => (
                                    <button
                                        key={channel.id}
                                        onClick={() => {
                                            setActiveChannel(channel.id);
                                            if (window.innerWidth < 768) setIsSidebarOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3",
                                            activeChannel === channel.id
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Hash className="w-4 h-4 opacity-70" />
                                        <div>
                                            <div className="font-medium">#{channel.name}</div>
                                            <div className="text-[10px] opacity-70 truncate max-w-[140px]">
                                                {channel.description}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 bg-muted/20 border-t border-border/10 text-xs text-center text-muted-foreground">
                                <Users className="w-3 h-3 inline mr-1" />
                                {CHANNELS.length} Active Channels
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat Area */}
                <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden relative">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-border/10 flex justify-between items-center bg-background/40 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <Hash className="w-5 h-5 text-muted-foreground" />
                            <h2 className="font-semibold text-lg">{CHANNELS.find(c => c.id === activeChannel)?.name}</h2>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Real-time
                        </div>
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                <MessageSquare className="w-12 h-12 mb-2" />
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isMe = msg.senderId === user?.uid;
                                const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;

                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex gap-3",
                                            isMe ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        <div className={cn("w-8 flex-shrink-0", !showAvatar && "opacity-0")}>
                                            <Avatar
                                                size={32}
                                                name={msg.senderName}
                                                variant="beam"
                                                colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
                                            />
                                        </div>
                                        <div className={cn(
                                            "flex flex-col max-w-[70%]",
                                            isMe ? "items-end" : "items-start"
                                        )}>
                                            {showAvatar && (
                                                <span className="text-[10px] text-muted-foreground mb-1 px-1">
                                                    {msg.senderName}
                                                </span>
                                            )}
                                            <div className={cn(
                                                "px-4 py-2 rounded-2xl text-sm break-words shadow-sm",
                                                isMe
                                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                    : "bg-muted text-foreground rounded-tl-sm"
                                            )}>
                                                {msg.text}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mt-1 px-1 opacity-50">
                                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-border/10 bg-background/40 backdrop-blur-md">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <input
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={`Message #${CHANNELS.find(c => c.id === activeChannel)?.name}...`}
                                className="flex-1 bg-muted/50 border-transparent rounded-xl px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                            />
                            <Button type="submit" size="icon" disabled={!inputText.trim()} className="rounded-xl">
                                <Send className="w-5 h-5" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default Community;
