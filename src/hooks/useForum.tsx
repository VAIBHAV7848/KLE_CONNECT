import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Question {
    id: string;
    question: string;
    author: string;
    subject: string;
    answers: number;
    votes: number;
    timestamp: string;
}

export const useForum = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchQuestions();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('forum_questions_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'forum_questions' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newQuestion = payload.new as any;
                        setQuestions(prev => [{
                            id: newQuestion.id,
                            question: newQuestion.question,
                            author: newQuestion.author_name,
                            subject: newQuestion.subject,
                            answers: newQuestion.answers_count,
                            votes: newQuestion.votes,
                            timestamp: newQuestion.timestamp,
                        }, ...prev]);
                    } else if (payload.eventType === 'DELETE') {
                        setQuestions(prev => prev.filter(q => q.id !== payload.old.id));
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedQuestion = payload.new as any;
                        setQuestions(prev => prev.map(q => 
                            q.id === updatedQuestion.id ? {
                                id: updatedQuestion.id,
                                question: updatedQuestion.question,
                                author: updatedQuestion.author_name,
                                subject: updatedQuestion.subject,
                                answers: updatedQuestion.answers_count,
                                votes: updatedQuestion.votes,
                                timestamp: updatedQuestion.timestamp,
                            } : q
                        ));
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchQuestions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('forum_questions')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('Error fetching forum questions:', error);
            setQuestions([]);
        } else if (data && data.length > 0) {
            setQuestions(data.map(q => ({
                id: q.id,
                question: q.question,
                author: q.author_name,
                subject: q.subject,
                answers: q.answers_count,
                votes: q.votes,
                timestamp: q.timestamp,
            })));
        } else {
            // Seed
            if (!localStorage.getItem('forum_seeded')) {
                await seedForum();
                localStorage.setItem('forum_seeded', 'true');
            } else {
                setQuestions([]);
            }
        }
        setLoading(false);
    };

    const askQuestion = async (text: string, subject: string) => {
        if (!user) return;

        const { error } = await supabase.from('forum_questions').insert({
            question: text,
            subject,
            author_id: user.uid,
            author_name: user.displayName || 'Anonymous',
            answers_count: 0,
            votes: 0,
            timestamp: new Date().toISOString(),
        });

        if (error) {
            console.error('Error asking question:', error);
            throw error;
        }
    };

    const upvoteQuestion = async (id: string) => {
        const { error } = await supabase.rpc('increment_votes', { question_id: id });

        if (error) {
            // Fallback: update directly
            const { data: question } = await supabase
                .from('forum_questions')
                .select('votes')
                .eq('id', id)
                .single();
            
            if (question) {
                await supabase
                    .from('forum_questions')
                    .update({ votes: question.votes + 1 })
                    .eq('id', id);
            }
        }
    };

    const seedForum = async () => {
        const seedData = [
            {
                question: 'How do I implement a min-heap from scratch in Python?',
                author_name: 'Rahul M.',
                subject: 'Data Structures',
                answers_count: 5,
                votes: 12,
                timestamp: new Date(Date.now() - 7200000).toISOString(),
            },
            {
                question: 'Can someone explain the difference between mutex and semaphore?',
                author_name: 'Priya S.',
                subject: 'Operating Systems',
                answers_count: 8,
                votes: 24,
                timestamp: new Date(Date.now() - 18000000).toISOString(),
            }
        ];

        for (const q of seedData) {
            await supabase.from('forum_questions').insert(q);
        }
    };

    return { questions, loading, askQuestion, upvoteQuestion };
};
