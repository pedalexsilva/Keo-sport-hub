import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface CMSConfig {
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    announcement: string;
}

export interface AppMenuConfig {
    id: string;
    label: string;
    path: string;
    icon: string;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    created_at: string;
}

export function useCMS() {
    return useQuery({
        queryKey: ['cms'],
        queryFn: async (): Promise<CMSConfig> => {
            const { data, error } = await supabase
                .from('cms_config')
                .select('value')
                .eq('key', 'landing_page')
                .single();

            if (error) {
                // Fallback defaults if table empty
                return {
                    heroTitle: "KEO Sports Hub",
                    heroSubtitle: "A plataforma de bem-estar da KEO.",
                    heroImage: "https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80",
                    announcement: "Bem-vindo!"
                };
            }
            return data.value;
        }
    });
}

export function useUpdateCMS() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (config: CMSConfig) => {
            const { error } = await supabase
                .from('cms_config')
                .upsert({
                    key: 'landing_page',
                    value: config,
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cms'] });
        }
    });
}

export function useAppMenu() {
    return useQuery({
        queryKey: ['app_menu'],
        queryFn: async (): Promise<AppMenuConfig[]> => {
            const { data, error } = await supabase
                .from('cms_config')
                .select('value')
                .eq('key', 'app_menu')
                .single();

            if (error) {
                // Return default strict structure if missing
                return [
                    { id: 'home', label: 'Início', path: '/app/home', icon: 'Home' },
                    { id: 'events', label: 'Eventos', path: '/app/events', icon: 'Calendar' },
                    { id: 'store', label: 'Loja', path: '/app/store', icon: 'ShoppingBag' },
                    { id: 'social', label: 'Social', path: '/app/social', icon: 'Users' },
                    { id: 'profile', label: 'Perfil', path: '/app/profile', icon: 'User' },
                ];
            }
            return data.value;
        }
    });
}

export function useUpdateAppMenu() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (menu: AppMenuConfig[]) => {
            const { error } = await supabase
                .from('cms_config')
                .upsert({
                    key: 'app_menu',
                    value: menu,
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['app_menu'] });
        }
    });
}

export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async (): Promise<Notification[]> => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
    });
}

export function useCreateNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (note: Pick<Notification, 'title' | 'message' | 'type'>) => {
            const { error } = await supabase
                .from('notifications')
                .insert(note);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });
}

export const uploadCMSMedia = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('cms-media')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('cms-media')
        .getPublicUrl(filePath);

    return data.publicUrl;
};
