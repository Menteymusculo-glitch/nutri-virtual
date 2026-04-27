import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function setupTables() {
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS clients (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        name text NOT NULL,
        profile jsonb,
        plan jsonb,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS checkins (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        client_name text NOT NULL,
        week integer DEFAULT 1,
        current_weight numeric,
        energy_level integer,
        adherence integer,
        digestion integer,
        sleep integer,
        notes text,
        successes text,
        created_at timestamptz DEFAULT now()
      );
    `
  })
}
