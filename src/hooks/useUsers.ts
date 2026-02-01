import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    office: string;
    avatar: string;
    points: number;
    status: 'Ativo' | 'Inativo';
    created_at: string;
}

export function useUsers() {
    return useQuery({
        queryKey: ['admin_users'],
        queryFn: async (): Promise<AdminUser[]> => {
            // Note: profiles table might not have created_at, so we order by updated_at or id
            const { data, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) throw error;

            return (data || []).map(u => ({
                id: u.id,
                email: u.email || 'Sem email', // Now reading from profile, fallback if empty
                name: u.full_name || u.username || 'Utilizador', // Correct priority: Full Name > Username > Default
                role: u.role || 'Colaborador',
                office: u.office || 'N/A',
                avatar: u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || u.email || 'User')}&background=random`,
                points: u.total_points || 0,
                status: 'Ativo',
                created_at: u.updated_at
            }));
        }
    });
}

export function useUserStats() {
    return useQuery({
        queryKey: ['admin_user_stats'],
        queryFn: async () => {
            const { count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            return count || 0;
        }
    });
}
