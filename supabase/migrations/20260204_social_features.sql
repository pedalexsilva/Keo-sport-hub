-- Migration: Social Features
-- Description: Adds tables for social posts and likes, replacing hardcoded frontend data.

-- 1. Create Social Posts Table
CREATE TABLE IF NOT EXISTS public.social_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    content text NOT NULL,
    image_url text, -- Optional image
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Create Social Likes Table
CREATE TABLE IF NOT EXISTS public.social_likes (
    post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

-- 3. Enable RLS
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_likes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Posts: Everyone can view
CREATE POLICY "Everyone can view posts" ON public.social_posts
    FOR SELECT USING (true);

-- Posts: Authenticated users can create
CREATE POLICY "Users can create posts" ON public.social_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Likes: Everyone can view
CREATE POLICY "Everyone can view likes" ON public.social_likes
    FOR SELECT USING (true);

-- Likes: Authenticated users can toggle likes
CREATE POLICY "Users can like posts" ON public.social_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON public.social_likes
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Seed Data (to replace hardcoded frontend data)
-- We need to insert dummy data linked to existing users. 
-- Since we don't know exact UUIDs, we'll try to link to the first found users or insert safely.

DO $$
DECLARE
    v_user1_id uuid;
    v_user2_id uuid;
BEGIN
    -- Try to get two users
    SELECT id INTO v_user1_id FROM public.profiles LIMIT 1;
    SELECT id INTO v_user2_id FROM public.profiles OFFSET 1 LIMIT 1;

    -- If we don't have a second user, use the first one for both
    IF v_user2_id IS NULL THEN
        v_user2_id := v_user1_id;
    END IF;

    -- Only seed if we have at least one user and table is empty
    IF v_user1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.social_posts) THEN
        
        -- Post 1 (Matches "Ana Silva" from mock)
        INSERT INTO public.social_posts (user_id, content, image_url, created_at)
        VALUES (
            v_user1_id, 
            'Morning run before work! Porto is beautiful today. 🏃‍♀️🌉', 
            'https://images.unsplash.com/photo-1596464716127-f9a0639b5831?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            now() - interval '2 hours'
        );

        -- Post 2 (Matches "BIM Team" from mock)
        INSERT INTO public.social_posts (user_id, content, image_url, created_at)
        VALUES (
            v_user2_id, 
            'Healthy lunch to recharge! 🥗 #KEOWellness', 
            'https://images.unsplash.com/photo-1543362906-ac1b9642f56b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            now() - interval '4 hours'
        );

    END IF;
END $$;
