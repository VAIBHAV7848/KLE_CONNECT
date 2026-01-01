import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, push, remove, update } from 'firebase/database';

export interface Note {
    id: string;
    title: string;
    subject: string;
    link: string;
    rating: number;
    downloads: number;
    uploadedBy?: string;
    uploadedAt?: number;
}

export const useNotes = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const notesRef = ref(database, 'notes');

        // Listen for real-time updates
        const unsubscribe = onValue(notesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const notesList = Object.entries(data).map(([key, value]: [string, any]) => ({
                    id: key,
                    ...value,
                }));
                setNotes(notesList.reverse()); // Newest first
            } else {
                // Seed initial data if empty (for demo purposes)
                if (!localStorage.getItem('notes_seeded')) {
                    seedNotes();
                    localStorage.setItem('notes_seeded', 'true');
                } else {
                    setNotes([]);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addNote = async (note: Omit<Note, 'id' | 'rating' | 'downloads'>) => {
        const notesRef = ref(database, 'notes');
        await push(notesRef, {
            ...note,
            rating: 5.0,
            downloads: 0,
            uploadedAt: Date.now()
        });
    };

    const deleteNote = async (id: string) => {
        const noteRef = ref(database, `notes/${id}`);
        await remove(noteRef);
    };

    const seedNotes = async () => {
        const seedData = [
            {
                title: 'DSA: Comprehensive Revision Guide',
                subject: 'Data Structures',
                link: 'https://www.geeksforgeeks.org/data-structures/',
                rating: 4.9,
                downloads: 1240
            },
            {
                title: 'Unit 4: Neural Networks PYQs',
                subject: 'AI & Machine Learning',
                link: 'https://archive.org/details/artificialintelligencepastpapers',
                rating: 4.8,
                downloads: 850
            },
            {
                title: 'DBMS SQL Cheat Sheet (Semester 5)',
                subject: 'Database Systems',
                link: 'https://web.stanford.edu/class/cs145/cheatsheet.pdf',
                rating: 5.0,
                downloads: 3100
            }
        ];

        const notesRef = ref(database, 'notes');
        for (const note of seedData) {
            await push(notesRef, note);
        }
    };

    return { notes, loading, addNote, deleteNote };
};
