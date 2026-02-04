import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    strava_connected: boolean;
    strava_athlete_id?: string;
}

export function useUsers() {
    return useQuery({
        queryKey: ['admin_users'],
        queryFn: async (): Promise<AdminUser[]> => {
            // Fetch profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*');

            // Fetch strava tokens to check connection status (only user_id is selectable for admins via RLS)
            let connectedUserIds = new Set<string>();
            try {
                const { data: tokens } = await supabase
                    .from('strava_tokens')
                    .select('user_id');
                
                if (tokens) {
                    tokens.forEach((t: any) => connectedUserIds.add(t.user_id));
                }

                // Also check device_connections for completeness
                const { data: conns } = await supabase
                    .from('device_connections')
                    .select('user_id')
                    .eq('platform', 'strava')
                    .eq('is_active', true);
                
                if (conns) {
                    conns.forEach((c: any) => connectedUserIds.add(c.user_id));
                }
            } catch (e) {
                console.error('Error fetching strava status:', e);
            }

            return (profiles || []).map(u => {
                const isStravaConnected = connectedUserIds.has(u.id) || Boolean(u.strava_access_token);
                return {
                    id: u.id,
                    email: u.email || 'Sem email',
                    name: u.full_name || u.username || 'Utilizador',
                    role: u.role || 'Colaborador',
                    office: u.office || 'N/A',
                    avatar: u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || u.email || 'User')}&background=random`,
                    points: u.total_points || 0,
                    status: u.is_blocked ? 'Inativo' : 'Ativo',
                    created_at: u.updated_at,
                    strava_connected: isStravaConnected,
                    strava_athlete_id: undefined
                };
            });
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

export interface DepartmentStats {
    office: string;
    totalPoints: number;
    userCount: number;
}

export function useDepartmentRanking() {
    return useQuery({
        queryKey: ['admin_department_ranking'],
        queryFn: async (): Promise<DepartmentStats[]> => {
            const { data, error } = await supabase
                .from('profiles')
                .select('office, total_points');

            if (error) throw error;

            const map = new Map<string, DepartmentStats>();

            data?.forEach((p: any) => {
                const office = p.office || 'Outros';
                const current = map.get(office) || { office, totalPoints: 0, userCount: 0 };
                
                current.totalPoints += (p.total_points || 0);
                current.userCount += 1;
                
                map.set(office, current);
            });

            return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints);
        }
    });
}

// Update user profile
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { full_name?: string; role?: string; office?: string } }) => {
            const { error } = await supabase
                .from('profiles')
                .update(data)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_users'] });
        }
    });
}

// Block/Unblock user
export function useBlockUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, block }: { id: string; block: boolean }) => {
            const { error } = await supabase
                .from('profiles')
                .update({ is_blocked: block })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_users'] });
        }
    });
}

// Add bonus points to user
export function useAddBonusPoints() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, points, reason }: { id: string; points: number; reason: string }) => {
            // First get current points
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('total_points')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            const newPoints = (profile?.total_points || 0) + points;

            // Update total points
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ total_points: newPoints })
                .eq('id', id);

            if (updateError) throw updateError;

            // Optionally log the bonus in a separate table (if exists)
            // await supabase.from('bonus_log').insert({ user_id: id, points, reason });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_users'] });
        }
    });
}
