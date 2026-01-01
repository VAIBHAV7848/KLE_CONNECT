import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, push, update, serverTimestamp, increment } from 'firebase/database';
import { useAuth } from './useAuth';

export interface Question {
    id: string;
    question: string;
    author: string;
    subject: string;
    answers: number;
    votes: number;
    timestamp: number;
}

export const useForum = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const forumRef = ref(database, 'forum');

        const unsubscribe = onValue(forumRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, value]: [string, any]) => ({
                    id: key,
                    ...value
                }));
                setQuestions(list.sort((a, b) => b.timestamp - a.timestamp));
            } else {
                // Seed
                if (!localStorage.getItem('forum_seeded')) {
                    seedForum();
                    localStorage.setItem('forum_seeded', 'true');
                } else {
                    setQuestions([]);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const askQuestion = async (text: string, subject: string) => {
        if (!user) return;

        const forumRef = ref(database, 'forum');
        await push(forumRef, {
            question: text,
            subject,
            author: user.displayName || 'Anonymous',
            answers: 0,
            votes: 0,
            timestamp: serverTimestamp()
        });
    };

    const upvoteQuestion = async (id: string) => {
        const qRef = ref(database, `forum/${id}`);
        await update(qRef, {
            votes: increment(1)
        });
    };

    const seedForum = async () => {
        const seedData = [
            {
                question: 'How do I implement a min-heap from scratch in Python?',
                author: 'Rahul M.',
                subject: 'Data Structures',
                answers: 5,
                votes: 12,
                timestamp: Date.now() - 7200000
            },
            {
                question: 'Can someone explain the difference between mutex and semaphore?',
                author: 'Priya S.',
                subject: 'Operating Systems',
                answers: 8,
                votes: 24,
                timestamp: Date.now() - 18000000
            }
        ];

        const forumRef = ref(database, 'forum');
        for (const q of seedData) {
            await push(forumRef, q);
        }
    };

    return { questions, loading, askQuestion, upvoteQuestion };
};
