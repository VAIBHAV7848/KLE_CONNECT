import { useState, useEffect } from 'react';
import { database, auth } from '@/lib/firebase';
import { ref, onValue, push, serverTimestamp, query, limitToLast, orderByKey } from 'firebase/database';
import { useAuth } from './useAuth';

export interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: number;
    channelId: string;
}

export const useChat = (channelId: string = 'general') => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        // Reference to the specific channel in Realtime DB
        const messagesRef = query(
            ref(database, `chats/${channelId}`),
            orderByKey(),
            limitToLast(100)
        );

        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const messageList = Object.entries(data).map(([key, value]: [string, any]) => ({
                    id: key,
                    ...value,
                }));
                setMessages(messageList);
            } else {
                setMessages([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [channelId]);

    const sendMessage = async (text: string) => {
        if (!user || !text.trim()) return;

        const messagesRef = ref(database, `chats/${channelId}`);

        // Push new message
        await push(messagesRef, {
            text,
            senderId: user.uid,
            senderName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            timestamp: serverTimestamp(),
            channelId
        });
    };

    return { messages, loading, sendMessage };
};
