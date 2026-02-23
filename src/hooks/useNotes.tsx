import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from './useRealtimeTable';

export interface Note {
    id: string;
    title: string;
    subject: string;
    link: string;
    rating: number;
    downloads: number;
    uploaded_by?: string;
    uploaded_by_name?: string;
    created_at?: string;
}

export const useNotes = () => {
    const {
        data: notes,
        loading,
        addItem,
        removeItem
    } = useRealtimeTable<Note>({
        table: 'notes',
        orderBy: { column: 'created_at', ascending: false },
        limit: 50
    });

    const addNote = useCallback(async (note: Omit<Note, 'id' | 'rating' | 'downloads' | 'created_at'>) => {
        const { data: { user } } = await supabase.auth.getUser();

        const newNote: Partial<Note> = {
            title: note.title,
            subject: note.subject,
            link: note.link,
            rating: 5.0,
            downloads: 0,
            uploaded_by: user?.id,
            uploaded_by_name: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Anonymous',
        };

        // Optimistic Update
        addItem({ ...newNote, id: crypto.randomUUID() } as Note);

        const { error } = await supabase.from('notes').insert(newNote);

        if (error) {
            console.error('Error adding note:', error);
            // In a real app, we'd roll back the optimistic update here
            throw error;
        }
    }, [addItem]);

    const deleteNote = useCallback(async (id: string) => {
        // Optimistic Update
        removeItem(id);

        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    }, [removeItem]);

    return { notes, loading, addNote, deleteNote };
};

