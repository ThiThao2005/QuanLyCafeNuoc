import { createClient } from '@supabase/supabase-js';

// URL sẽ có định dạng: https://[Project-ID].supabase.co
const supabaseUrl = 'https://gsydqpsjuegkzjzcypob.supabase.co';
const supabaseAnonKey = 'sb_publishable_BQ6L3OkhXmYuDnmH38334Q_ZsLum2L7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);