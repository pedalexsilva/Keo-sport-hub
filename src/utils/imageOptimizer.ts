/**
 * Optimizes Supabase Storage URLs by appending transformation parameters.
 * This leverages Supabase's built-in image transformation capabilities.
 * 
 * @param url The original image URL (must be from Supabase Storage)
 * @param width Target width in pixels
 * @param height Target height in pixels (optional)
 * @param resize Resize mode ('cover' | 'contain' | 'fill') - default: 'cover'
 * @returns The optimized URL with query parameters
 */
export const getOptimizedImageUrl = (
    url: string,
    width: number,
    height?: number,
    resize: 'cover' | 'contain' | 'fill' = 'cover'
): string => {
    if (!url) return '';

    // Only optimize Supabase Storage URLs
    // Adjust this check if you have a custom domain mapped to Supabase Storage
    const isSupabaseUrl = url.includes('supabase.co') || url.includes('/storage/v1/object/public/');

    if (!isSupabaseUrl) return url;

    try {
        const urlObj = new URL(url);

        // Add transformation parameters
        urlObj.searchParams.set('width', width.toString());
        urlObj.searchParams.set('resize', resize);
        urlObj.searchParams.set('quality', '80'); // Reasonable default for web

        if (height) {
            urlObj.searchParams.set('height', height.toString());
        }

        return urlObj.toString();
    } catch (e) {
        // Fallback to original URL if parsing fails
        return url;
    }
};
