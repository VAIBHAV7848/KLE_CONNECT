import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: string;
    channelId: string;
}

export const useChat = (channelId: string = 'general') => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchMessages();

        // Subscribe to realtime changes for this channel
        const subscription = supabase
            .channel(`chats_${channelId}`)
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'chats',
                    filter: `channel_id=eq.${channelId}`
                },
                (payload) => {
                    const newMessage = payload.new as any;
                    setMessages(prev => [...prev, {
                        id: newMessage.id,
                        text: newMessage.text,
                        senderId: newMessage.sender_id,
                        senderName: newMessage.sender_name,
                        timestamp: newMessage.timestamp,
                        channelId: newMessage.channel_id,
                    }]);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [channelId]);

    const fetchMessages = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('channel_id', channelId)
            .order('timestamp', { ascending: true })
            .limit(100);

        if (error) {
            console.error('Error fetching messages:', error);
            setMessages([]);
        } else {
            setMessages(data?.map(msg => ({
                id: msg.id,
                text: msg.text,
                senderId: msg.sender_id,
                senderName: msg.sender_name,
                timestamp: msg.timestamp,
                channelId: msg.channel_id,
            })) || []);
        }
        setLoading(false);
    };

    const sendMessage = async (text: string) => {
        if (!user || !text.trim()) return;

        const { error } = await supabase.from('chats').insert({
            channel_id: channelId,
            sender_id: user.uid,
            sender_name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            text: text.trim(),
            timestamp: new Date().toISOString(),
        });

        if (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    };

    return { messages, loading, sendMessage };
};
