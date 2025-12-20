import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
    throw new Error(
        `Missing required Supabase configuration. Please set the following environment variables: ${missing.join(', ')}. ` +
        'Create a .env file in the project root with these values.'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
