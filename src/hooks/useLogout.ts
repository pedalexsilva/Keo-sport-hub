import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function useLogout() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            queryClient.clear(); // Clear all cached data
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Even if error, force redirect
            navigate('/login');
        }
    };

    return logout;
}
