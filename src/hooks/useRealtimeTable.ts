import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeManager } from '@/lib/RealtimeManager';
import { supabase } from '@/lib/supabase';

interface UseRealtimeTableOptions<T> {
    table: string;
    filter?: string;
    select?: string;
    initialData?: T[];
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
}

export function useRealtimeTable<T extends { id: string | number }>({
    table,
    filter,
    select = '*',
    initialData = [],
    orderBy = { column: 'created_at', ascending: false },
    limit = 50,
}: UseRealtimeTableOptions<T>) {
    const [data, setData] = useState<T[]>(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Use ref to avoid closure issues in subscription callback
    const dataRef = useRef<T[]>(data);
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase.from(table).select(select);

            if (filter) {
                // Simple parser for filter string like "user_id=eq.xxx"
                const [col, rest] = filter.split('=');
                const [op, val] = rest.split('.');
                if (op === 'eq') (query as any) = query.eq(col, val);
            }

            const { data: fetchedData, error: fetchError } = await query
                .order(orderBy.column, { ascending: orderBy.ascending })
                .limit(limit);

            if (fetchError) throw fetchError;
            setData(fetchedData as T[]);
        } catch (err: any) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [table, filter, select, orderBy.column, orderBy.ascending, limit]);

    useEffect(() => {
        fetchData();

        const handleReconnect = () => {
            console.log(`[useRealtimeTable] Reconnected to ${table}, re-fetching...`);
            fetchData();
        };

        window.addEventListener('supabase-realtime-reconnected', handleReconnect);

        const unsubscribe = realtimeManager.subscribe<T>(table, filter, (payload) => {
            const { eventType, new: newItem, old: oldItem } = payload;

            setData((prev) => {
                switch (eventType) {
                    case 'INSERT':
                        return [newItem, ...prev].slice(0, limit);
                    case 'UPDATE':
                        return prev.map((item) => (item.id === (newItem as any).id ? newItem : item));
                    case 'DELETE':
                        return prev.filter((item) => (item.id !== (oldItem as any).id));
                    default:
                        return prev;
                }
            });
        });

        // Cleanup on unmount
        return () => {
            unsubscribe();
            window.removeEventListener('supabase-realtime-reconnected', handleReconnect);
        };
    }, [table, filter, fetchData, limit]);


    // Optimistic UI updates
    const addItem = useCallback((newItem: T) => {
        setData((prev) => [newItem, ...prev].slice(0, limit));
    }, [limit]);

    const updateItem = useCallback((updatedItem: T) => {
        setData((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    }, []);

    const removeItem = useCallback((id: string | number) => {
        setData((prev) => prev.filter((item) => item.id !== id));
    }, []);

    return { data, loading, error, fetchData, addItem, updateItem, removeItem };
}
