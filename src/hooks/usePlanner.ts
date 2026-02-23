import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from './useRealtimeTable';

export interface PlannerTask {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    deadline: string | null;
    priority: 'low' | 'medium' | 'high';
    status: 'todo' | 'in_progress' | 'done';
    created_at: string;
}

export const usePlanner = () => {
    const {
        data: tasks,
        loading,
        addItem,
        updateItem,
        removeItem
    } = useRealtimeTable<PlannerTask>({
        table: 'planner_tasks',
        orderBy: { column: 'deadline', ascending: true },
    });

    const addTask = useCallback(async (task: Omit<PlannerTask, 'id' | 'user_id' | 'created_at' | 'status'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newTask: Partial<PlannerTask> = {
            ...task,
            user_id: user.id,
            status: 'todo',
        };

        // Optimistic Update
        addItem({ ...newTask, id: crypto.randomUUID(), created_at: new Date().toISOString() } as PlannerTask);

        const { error } = await supabase.from('planner_tasks').insert(newTask);
        if (error) throw error;
    }, [addItem]);

    const toggleTaskStatus = useCallback(async (taskId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'done' ? 'todo' : 'done';

        // Optimistic Update
        const task = tasks.find(t => t.id === taskId);
        if (task) updateItem({ ...task, status: newStatus as any });

        await supabase
            .from('planner_tasks')
            .update({ status: newStatus })
            .eq('id', taskId);
    }, [tasks, updateItem]);

    return { tasks, loading, addTask, toggleTaskStatus, deleteTask: removeItem };
};
