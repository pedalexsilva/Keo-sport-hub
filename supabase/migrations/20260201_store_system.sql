-- Migration: Store System & Gamification Logic

-- 1. Update Profiles Table
-- Add columns for gamification and org structure
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS balance int DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_points_all_time int DEFAULT 0;

-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    cost int NOT NULL CHECK (cost >= 0),
    stock int NOT NULL DEFAULT 0,
    category text NOT NULL, -- 'Merch', 'Benefit', 'Break'
    image_url text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active products
CREATE POLICY "Active products are viewable by everyone" ON public.products
    FOR SELECT USING (active = true);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    product_id uuid REFERENCES public.products(id) NOT NULL,
    status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own orders
CREATE POLICY "Users can see own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can see all orders
CREATE POLICY "Admins can see all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Policy: Admins can update orders (approve/reject)
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 4. Function: Purchase Item
-- Handles the transaction: checks balance, deducts points, reduces stock, creates order
CREATE OR REPLACE FUNCTION public.purchase_item(p_product_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_product_cost int;
    v_product_stock int;
    v_user_balance int;
    v_order_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Get product details
    SELECT cost, stock INTO v_product_cost, v_product_stock
    FROM public.products
    WHERE id = p_product_id AND active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found or inactive';
    END IF;
    
    -- Check stock
    IF v_product_stock <= 0 THEN
        RAISE EXCEPTION 'Product out of stock';
    END IF;
    
    -- Get user balance
    SELECT balance INTO v_user_balance
    FROM public.profiles
    WHERE id = v_user_id;
    
    -- Check balance
    IF v_user_balance < v_product_cost THEN
        RAISE EXCEPTION 'Insufficient points';
    END IF;
    
    -- Execute Transaction
    
    -- 1. Deduct points
    UPDATE public.profiles
    SET balance = balance - v_product_cost
    WHERE id = v_user_id;
    
    -- 2. Reduce stock
    UPDATE public.products
    SET stock = stock - 1
    WHERE id = p_product_id;
    
    -- 3. Create Order
    INSERT INTO public.orders (user_id, product_id, status)
    VALUES (v_user_id, p_product_id, 'pending')
    RETURNING id INTO v_order_id;
    
    RETURN json_build_object('success', true, 'order_id', v_order_id);
END;
$$;

-- 5. Trigger: Add points from Activities to Balance
-- When an activity is manually added or synced, add its points to the user's balance
CREATE OR REPLACE FUNCTION public.handle_new_activity_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET balance = balance + NEW.points,
        total_points_all_time = total_points_all_time + NEW.points
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_activity_created ON public.activities;
CREATE TRIGGER on_activity_created
    AFTER INSERT ON public.activities
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_activity_points();

-- Seed some initial data
INSERT INTO public.products (name, description, cost, stock, category, image_url) VALUES 
('Garrafa Térmica KEO', 'Mantém a tua água fresca durante todo o dia.', 800, 45, 'Merch', 'https://images.unsplash.com/photo-1602143407151-011141950038?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),
('Voucher Saída 1h Cedo', 'Sai mais cedo na sexta-feira!', 2500, 999, 'Benefícios', 'https://images.unsplash.com/photo-1499750310159-57751c6e9f26?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),
('Hoodie KEO Active', 'Hoodie exclusivo da equipa.', 3500, 12, 'Merch', 'https://images.unsplash.com/photo-1556906781-9a412961d289?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),
('Café Grátis (Semana)', 'Café ilimitado durante uma semana.', 300, 50, 'Pausa', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80');

