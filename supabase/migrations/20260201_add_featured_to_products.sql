-- Migration: Add Featured Flag to Products table
-- Description: Adds an 'is_featured' boolean column to the products table to allow highlighting specific items in the store.

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Initial data update (optional, just to be safe)
UPDATE public.products SET is_featured = false WHERE is_featured IS NULL;
