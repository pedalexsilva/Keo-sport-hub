-- Migration: Create cms_config table
-- Run this in Supabase SQL Editor to fix 406 error

-- 1. Create CMS Config Table (Key-Value Store)
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

-- Policy: Authenticated users can update config
DROP POLICY IF EXISTS "Authenticated can update cms config" ON public.cms_config;
CREATE POLICY "Authenticated can update cms config" ON public.cms_config
    FOR ALL USING (auth.role() = 'authenticated');

-- Seed Initial Data (office_locations, landing_page, app_menu)
INSERT INTO public.cms_config (key, value) VALUES 
('office_locations', '[
    {"id": "dubai", "name": "Dubai"},
    {"id": "abu-dhabi", "name": "Abu Dhabi"},
    {"id": "riyadh", "name": "Riyadh"},
    {"id": "qatar", "name": "Qatar"},
    {"id": "kuwait", "name": "Kuwait"},
    {"id": "bahrain", "name": "Bahrain"},
    {"id": "oman", "name": "Oman"},
    {"id": "jordan", "name": "Jordan"},
    {"id": "sri-lanka", "name": "Sri Lanka"},
    {"id": "lisbon", "name": "Lisbon"},
    {"id": "porto", "name": "Porto"},
    {"id": "madrid", "name": "Madrid"},
    {"id": "london", "name": "London"},
    {"id": "dublin", "name": "Dublin"}
]'::jsonb),
('landing_page', '{"heroTitle": "KEO Sports Hub", "heroSubtitle": "The KEO wellness platform.", "heroImage": "https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80", "announcement": "Welcome to the new App! 🚀"}'::jsonb),
('app_menu', '[
    {"id": "home", "label": "Home", "path": "/app/home", "icon": "Home"},
    {"id": "events", "label": "Events", "path": "/app/events", "icon": "Calendar"},
    {"id": "store", "label": "Store", "path": "/app/store", "icon": "ShoppingBag"},
    {"id": "social", "label": "Social", "path": "/app/social", "icon": "Users"},
    {"id": "profile", "label": "Profile", "path": "/app/profile", "icon": "User"}
]'::jsonb)
ON CONFLICT (key) DO NOTHING;
