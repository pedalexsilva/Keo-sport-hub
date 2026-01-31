import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Product {
    id: string;
    name: string;
    description: string;
    cost: number;
    stock: number;
    category: string;
    image_url: string;
    active: boolean;
}

export interface Order {
    id: string;
    product_id: string;
    status: string;
    created_at: string;
}

export const useStore = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('active', true)
                .order('cost', { ascending: true });

            if (error) throw error;
            setProducts(data || []);
        } catch (err: any) {
            console.error('Error fetching products:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const purchaseItem = async (productId: string) => {
        try {
            const { data, error } = await supabase
                .rpc('purchase_item', { p_product_id: productId });

            if (error) throw error;

            // Refresh products to update stock
            fetchProducts();
            return { success: true, data };
        } catch (err: any) {
            console.error('Error purchasing item:', err);
            return { success: false, error: err.message };
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return {
        products,
        loading,
        error,
        purchaseItem,
        refresh: fetchProducts
    };
};
