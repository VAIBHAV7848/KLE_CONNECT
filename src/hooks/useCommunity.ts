import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from './useRealtimeTable';

export interface CommunityPost {
    id: string;
    user_id: string;
    content: string;
    image_url: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
}

export const useCommunity = () => {
    const {
        data: posts,
        loading,
        addItem,
        updateItem
    } = useRealtimeTable<CommunityPost>({
        table: 'community_posts',
        orderBy: { column: 'created_at', ascending: false },
        limit: 30
    });

    const createPost = useCallback(async (content: string, imageUrl?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newPost: Partial<CommunityPost> = {
            user_id: user.id,
            content,
            image_url: imageUrl || null,
            likes_count: 0,
            comments_count: 0,
        };

        // Optimistic Update
        addItem({ ...newPost, id: crypto.randomUUID(), created_at: new Date().toISOString() } as CommunityPost);

        const { error } = await supabase.from('community_posts').insert(newPost);
        if (error) throw error;
    }, [addItem]);

    const likePost = useCallback(async (postId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Supabase RLS will handle multi-like prevention on DB level
        const { error } = await supabase
            .from('community_likes')
            .insert({ post_id: postId, user_id: user.id });

        if (error && error.code !== '23505') throw error; // 23505 is unique violation (already liked)
    }, []);

    return { posts, loading, createPost, likePost };
};
