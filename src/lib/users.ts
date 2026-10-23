import { supabaseAdmin } from '@/lib/auth-server'
import { appUrl, INVITE_PATH } from '@/lib/authRedirect'

// Supabase admin API (auth-js 2.110) has no direct lookup by email, and
// listUsers is paginated. Looking only at the first page creates duplicates
// once there are more than `perPage` users, so we walk every page.
const PAGE_SIZE = 1000
// Hard stop so a misbehaving API can never loop forever (1M users).
const MAX_PAGES = 1000

function normalize(email: string): string {
  return email.toLowerCase().trim()
}

// Returns the auth user id for an email, or null if none exists.
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const target = normalize(email)

  // 1) Fast path: the access table stores the email of every paying user.
  const { data: accessRow, error: accessError } = await supabaseAdmin
    .from('access')
    .select('user_id')
    .eq('email', target)
    .maybeSingle()
  if (accessError) {
    // Duplicates or transient error — fall back to the auth listing.
    console.warn('[users] access lookup failed, falling back to listUsers:', accessError.message)
  } else if (accessRow?.user_id) {
    return accessRow.user_id as string
  }

  // 2) Slow path: walk every page of auth users.
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    if (error) throw new Error(`listUsers failed: ${error.message}`)

    const users = data?.users ?? []
    const found = users.find((u) => u.email && normalize(u.email) === target)
    if (found) return found.id

    const nextPage = (data as { nextPage?: number | null } | undefined)?.nextPage
    if (users.length < PAGE_SIZE || nextPage === null) break
  }
  return null
}

// Returns the existing user id or invites a new user (creates the auth account
// and sends the magic link).
export async function findOrCreateUser(email: string, redirectTo = appUrl(INVITE_PATH)): Promise<string> {
  const target = normalize(email)
  const existing = await findUserIdByEmail(target)
  if (existing) return existing

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(target, { redirectTo })
  if (error || !data.user) throw new Error(`inviteUserByEmail failed: ${error?.message}`)
  return data.user.id
}
