-- Migration: cms_and_notifications
-- Priority 4: Content & Communications

-- 1. CMS Config Table (Key-Value Store)
CREATE TABLE IF NOT EXISTS public.cms_config (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.cms_config ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read config (Public Landing Page)
DROP POLICY IF EXISTS "Public can view cms config" ON public.cms_config;
CREATE POLICY "Public can view cms config" ON public.cms_config
    FOR SELECT USING (true);

-- Policy: Only Admins can update config
DROP POLICY IF EXISTS "Admins can update cms config" ON public.cms_config;
CREATE POLICY "Admins can update cms config" ON public.cms_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Seed Initial Data
INSERT INTO public.cms_config (key, value) VALUES 
('landing_page', '{"heroTitle": "KEO Sports Hub", "heroSubtitle": "A plataforma de bem-estar da KEO.", "heroImage": "https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80", "announcement": "Bem-vindo à nova App! 🚀"}'::jsonb),
('app_menu', '[
    {"id": "home", "label": "Início", "path": "/app/home", "icon": "Home"},
    {"id": "events", "label": "Eventos", "path": "/app/events", "icon": "Calendar"},
    {"id": "store", "label": "Loja", "path": "/app/store", "icon": "ShoppingBag"},
    {"id": "social", "label": "Social", "path": "/app/social", "icon": "Users"},
    {"id": "profile", "label": "Perfil", "path": "/app/profile", "icon": "User"}
]'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- 2. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info', -- 'info', 'warning', 'success'
    target_audience text DEFAULT 'all', -- 'all', 'user', 'department'
    target_id text, -- user_id or department name if specific
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Public/Users can view relevant notifications
DROP POLICY IF EXISTS "Users can view relevant notifications" ON public.notifications;
CREATE POLICY "Users can view relevant notifications" ON public.notifications
    FOR SELECT USING (
        target_audience = 'all' OR 
        (target_audience = 'user' AND target_id = auth.uid()::text)
    );

-- Policy: Admins can manage notifications
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
