import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
  console.error('SUPABASE_URL:', supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'empty');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? '***' : 'missing');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
