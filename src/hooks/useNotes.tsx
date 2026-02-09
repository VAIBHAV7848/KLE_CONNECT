import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Note {
    id: string;
    title: string;
    subject: string;
    link: string;
    rating: number;
    downloads: number;
    uploadedBy?: string;
    uploadedByName?: string;
    uploadedAt?: string;
}

export const useNotes = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch initial notes
        fetchNotes();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('notes_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'notes' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setNotes(prev => [payload.new as Note, ...prev]);
                    } else if (payload.eventType === 'DELETE') {
                        setNotes(prev => prev.filter(note => note.id !== payload.old.id));
                    } else if (payload.eventType === 'UPDATE') {
                        setNotes(prev => prev.map(note => 
                            note.id === payload.new.id ? payload.new as Note : note
                        ));
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchNotes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notes:', error);
            setNotes([]);
        } else if (data && data.length > 0) {
            setNotes(data.map(note => ({
                id: note.id,
                title: note.title,
                subject: note.subject,
                link: note.link,
                rating: note.rating,
                downloads: note.downloads,
                uploadedBy: note.uploaded_by || undefined,
                uploadedByName: note.uploaded_by_name,
                uploadedAt: note.uploaded_at,
            })));
        } else {
            // Seed initial data if empty (for demo purposes)
            if (!localStorage.getItem('notes_seeded')) {
                await seedNotes();
                localStorage.setItem('notes_seeded', 'true');
            } else {
                setNotes([]);
            }
        }
        setLoading(false);
    };

    const addNote = async (note: Omit<Note, 'id' | 'rating' | 'downloads' | 'uploadedAt'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase.from('notes').insert({
            title: note.title,
            subject: note.subject,
            link: note.link,
            rating: 5.0,
            downloads: 0,
            uploaded_by: user?.id,
            uploaded_by_name: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Anonymous',
            uploaded_at: new Date().toISOString(),
        });

        if (error) {
            console.error('Error adding note:', error);
            throw error;
        }
    };

    const deleteNote = async (id: string) => {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    };

    const seedNotes = async () => {
        const seedData = [
            {
                title: 'DSA: Comprehensive Revision Guide',
                subject: 'Data Structures',
                link: 'https://www.geeksforgeeks.org/data-structures/',
                rating: 4.9,
                downloads: 1240,
                uploaded_by_name: 'System',
            },
            {
                title: 'Unit 4: Neural Networks PYQs',
                subject: 'AI & Machine Learning',
                link: 'https://archive.org/details/artificialintelligencepastpapers',
                rating: 4.8,
                downloads: 850,
                uploaded_by_name: 'System',
            },
            {
                title: 'DBMS SQL Cheat Sheet (Semester 5)',
                subject: 'Database Systems',
                link: 'https://web.stanford.edu/class/cs145/cheatsheet.pdf',
                rating: 5.0,
                downloads: 3100,
                uploaded_by_name: 'System',
            }
        ];

        for (const note of seedData) {
            await supabase.from('notes').insert({
                ...note,
                uploaded_at: new Date().toISOString(),
            });
        }
    };

    return { notes, loading, addNote, deleteNote };
};
