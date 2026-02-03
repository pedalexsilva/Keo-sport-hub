import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/dateUtils';

export interface Post {
    id: string;
    content: string;
    image_url?: string;
    created_at: string;
    user_id: string;
    user: {
        name: string;
        avatar: string;
    };
    likes_count: number;
    has_liked: boolean;
    comments_count: number; // Placeholder for now
}

export function useSocialFeed(currentUserId?: string) {
    return useQuery({
        queryKey: ['social-feed', currentUserId],
        queryFn: async (): Promise<Post[]> => {
            // 1. Fetch Posts with User details
            const { data: posts, error } = await supabase
                .from('social_posts')
                .select(`
                    *,
                    user:profiles(full_name, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 2. Fetch Likes for these posts to determine count and "has_liked"
            // Note: In a larger app, we'd use a View or Count query, but for now we fetch relationships
            // Optimization: We could use .select('*, likes:social_likes(user_id)') but that might be heavy.
            // Let's do a separate fetch or use the .csv trick, or just keep it simple.
            
            // Simpler approach: Fetch all likes for these posts (if dataset is small) 
            // OR iterate. For this MVP, let's just fetch the posts and then we need counts.
            // Supabase "count" on foreign tables is tricky in one go without a View.
            // Let's assume we create a View in the future. For now, we will do client-side mapping 
            // or perform a secondary query for likes.
            
            // Better: use a .select with count? 
            // supabase.from('social_posts').select('*, social_likes(count)') -> This gives total likes.
            
            const { data: postsWithLikes, error: likesError } = await supabase
                .from('social_posts')
                .select(`
                    id,
                    content,
                    image_url,
                    created_at,
                    user_id,
                    user:profiles(full_name, avatar_url),
                    likes:social_likes(user_id)
                `)
                .order('created_at', { ascending: false });

            if (likesError) throw likesError;

            // Transform
            return postsWithLikes.map((p: any) => ({
                id: p.id,
                content: p.content,
                image_url: p.image_url,
                created_at: formatDate(p.created_at), // Format relative time? logic in component maybe better
                user_id: p.user_id,
                user: {
                    name: p.user?.full_name || 'Unknown User',
                    avatar: p.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.full_name || 'U')}`
                },
                likes_count: p.likes ? p.likes.length : 0,
                has_liked: currentUserId ? p.likes.some((l: any) => l.user_id === currentUserId) : false,
                comments_count: 0 // Not implemented yet
            }));
        }
    });
}

export function useToggleLike() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ postId, isLiked, userId }: { postId: string, isLiked: boolean, userId: string }) => {
            if (isLiked) {
                // Unlike
                const { error } = await supabase
                    .from('social_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', userId);
                if (error) throw error;
            } else {
                // Like
                const { error } = await supabase
                    .from('social_likes')
                    .insert({ post_id: postId, user_id: userId });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['social-feed'] });
        }
    });
}

export function useCreatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ content, image_url, userId }: { content: string, image_url?: string, userId: string }) => {
            const { error } = await supabase
                .from('social_posts')
                .insert({
                    user_id: userId,
                    content,
                    image_url
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['social-feed'] });
        }
    });
}
