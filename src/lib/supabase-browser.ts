import { createBrowserClient } from '@supabase/ssr'

// Fallback placeholders allow the module to load during static build;
// real values from Vercel env vars are used at runtime in the browser.
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder-key'
)
