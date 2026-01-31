import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Order } from './useStore';

export interface AdminOrder extends Order {
    product: Product;
    user_email: string; // Joined from profiles
}

export const useAdminStore = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = async () => {
        setLoading(true);
        try {
            // Fetch Products
            const { data: prodData } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            setProducts(prodData || []);

            // Fetch Orders with joins
            // Note: This relies on foreign keys setup in migration
            const { data: orderData } = await supabase
                .from('orders')
                .select(`
                    *,
                    product:products(*),
                    user:profiles(email) 
                `)
                .order('created_at', { ascending: false });

            // Map to flat structure
            const mappedOrders = (orderData || []).map((o: any) => ({
                id: o.id,
                product_id: o.product_id,
                status: o.status,
                created_at: o.created_at,
                product: o.product,
                user_email: o.user?.email || 'Unknown'
            }));

            setOrders(mappedOrders);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addProduct = async (product: Omit<Product, 'id' | 'active'>) => {
        const { error } = await supabase.from('products').insert({
            ...product,
            active: true
        });
        if (error) throw error;
        await fetchAll();
    };

    const deleteProduct = async (id: string) => {
        const { error } = await supabase.from('products').update({ active: false }).eq('id', id);
        if (error) throw error;
        await fetchAll();
    };

    const updateOrderStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('orders').update({ status }).eq('id', id);
        if (error) throw error;
        await fetchAll();
    }

    useEffect(() => {
        fetchAll();
    }, []);

    return {
        products,
        orders,
        loading,
        addProduct,
        deleteProduct,
        updateOrderStatus,
        refresh: fetchAll
    };
};
