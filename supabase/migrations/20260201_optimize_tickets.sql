-- Migration: Optimize Tickets Table
-- Objective: Add indexes to support filtering and sorting on tickets table.

CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets (user_id);
