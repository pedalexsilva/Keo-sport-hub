import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual config from .env (since we can't easily load dotenv in this context without installing it)
const SUPABASE_URL = 'https://pvmknwhkgqloteqntqyr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bWtud2hrZ3Fsb3RlcW50cXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE2MDEsImV4cCI6MjA4NTQyNzYwMX0.PwMxrjHsiyqmB2pPv6LSfF7YBE7nUpWTA_maBWq1vuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStorage() {
    console.log("Checking storage...");

    // 1. Try to list buckets (might fail with anon key)
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.log("List Buckets Error (Expected for Anon):", bucketError.message);
    } else {
        console.log("Buckets:", buckets.map(b => b.name));
    }

    // 2. Try to list files in 'store-products'
    console.log("Checking 'store-products' bucket...");
    const { data: files, error: listError } = await supabase.storage.from('store-products').list();

    if (listError) {
        console.error("Error accessing 'store-products' bucket:", listError);
    } else {
        console.log("Access successful. Files found:", files.length);
    }

    // 3. Try to upload a dummy file
    console.log("Attempting upload...");
    const dummyContent = new Uint8Array([1, 2, 3]);
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('store-products')
        .upload('test-upload.bin', dummyContent, { upsert: true });

    if (uploadError) {
        console.error("Upload failed:", uploadError);
    } else {
        console.log("Upload successful:", uploadData);
    }
}

checkStorage().catch(console.error);
