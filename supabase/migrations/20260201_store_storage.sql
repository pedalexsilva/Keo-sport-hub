-- Create storage bucket for Store Products
INSERT INTO storage.buckets (id, name, public) 
VALUES ('store-products', 'store-products', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Everyone can view store images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store-products' );

-- Policy: Only Admins can upload images
CREATE POLICY "Admins can upload store images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'store-products' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Policy: Admins can update/delete images
CREATE POLICY "Admins can update store images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'store-products' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can delete store images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'store-products' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
