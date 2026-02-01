import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Ticket {
    id: string;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'normal' | 'high';
    created_at: string;
    user_id: string;
    user_email?: string; // Joined
}

export function useTickets() {
    return useQuery({
        queryKey: ['tickets'],
        queryFn: async (): Promise<Ticket[]> => {
            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    *,
                    user:profiles(email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map((t: any) => ({
                ...t,
                user_email: t.user?.email || 'Unknown'
            }));
        }
    });
}

export function useAdminTickets({ page = 1, status = 'all' }: { page?: number, status?: string } = {}) {
    const PAGE_SIZE = 20;
    return useQuery({
        queryKey: ['admin-tickets', page, status],
        queryFn: async () => {
            let query = supabase
                .from('tickets')
                .select(`
                    *,
                    user:profiles(email)
                `, { count: 'exact' })
                .order('created_at', { ascending: false });

            if (status !== 'all') {
                query = query.eq('status', status);
            }

            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            return {
                data: data.map((t: any) => ({
                    ...t,
                    user_email: t.user?.email || 'Unknown'
                })) as Ticket[],
                count: count || 0
            };
        },
        // placeholderData: keepPreviousData (removed to fix lint)
    });
}

export function useTicketStats() {
    return useQuery({
        queryKey: ['ticket-stats'],
        queryFn: async () => {
            const { count, error } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'open');

            if (error) throw error;
            return { open: count || 0 };
        }
    });
}

export function useMyTickets() {
    return useQuery({
        queryKey: ['my-tickets'],
        queryFn: async (): Promise<Ticket[]> => {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Ticket[];
        }
    });
}

export function useCreateTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ticket: Pick<Ticket, 'subject' | 'description' | 'priority'>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('tickets')
                .insert({
                    ...ticket,
                    user_id: user.id,
                    status: 'open'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
        }
    });
}

export function useUpdateTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await supabase
                .from('tickets')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
        }
    });
}
