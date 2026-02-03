import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/dateUtils';

export interface FeedItem {
    id: string;
    type: 'order' | 'event' | 'user';
    title: string;
    subtitle: string;
    date: string;
    timestamp: number;
    status?: string;
}

export function useDashboardFeed() {
    return useQuery({
        queryKey: ['admin_dashboard_feed'],
        queryFn: async (): Promise<FeedItem[]> => {
            const items: FeedItem[] = [];

            // 1. Fetch recent orders
            const { data: orders } = await supabase
                .from('orders')
                .select(`
                    id, 
                    created_at, 
                    status, 
                    product:products(name),
                    user:profiles(email)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            orders?.forEach((o: any) => {
                items.push({
                    id: o.id,
                    type: 'order',
                    title: `Pedido: ${o.product?.name}`,
                    subtitle: o.user?.email || 'Utilizador',
                    date: formatDate(o.created_at),
                    timestamp: new Date(o.created_at).getTime(),
                    status: o.status
                });
            });

            // 2. Fetch recent events
            const { data: events } = await supabase
                .from('events')
                .select('id, title, date, created_at, type')
                .order('created_at', { ascending: false })
                .limit(5);

            events?.forEach((e: any) => {
                items.push({
                    id: e.id,
                    type: 'event',
                    title: `Novo Evento: ${e.title}`,
                    subtitle: e.type,
                    date: formatDate(e.created_at), // Using creation date for feed "recency"
                    timestamp: new Date(e.created_at).getTime()
                });
            });

            // 3. Fetch new users (optional, good for visibility)
            const { data: users } = await supabase
                .from('profiles')
                .select('id, full_name, email, updated_at') 
                // Assuming profiles has created_at or we skip.
                // Checking previous schema analysis, profiles usually has updated_at. Let's skip users for now to avoid errors if column missing.
                .limit(3); 
            
            // Sort by timestamp desc
            return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
        }
    });
}
