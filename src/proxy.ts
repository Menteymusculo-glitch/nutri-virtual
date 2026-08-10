import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() refreshes the session if expired
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  if (pathname === '/login') {
    if (user) return NextResponse.redirect(new URL('/', request.url))
    return response
  }

  // Recovery links embed the token in the URL hash — the server never sees it,
  // so the middleware must let this route through without a session check.
  if (pathname === '/reset-password') {
    return response
  }

  // /nutrivirtual → rewrite to homepage (alias for the nutrition tool landing)
  if (pathname === '/nutrivirtual') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Public lead-magnet pages — no login required
  if (pathname === '/quiz-identidad' || pathname === '/calculadora-grasa') {
    return response
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // /motordeidentidad — requires active tool access (training_club or premium)
  // We don't call hasToolAccess here (too slow in middleware); the page itself
  // calls GET /api/identity-diagnostics which performs the real access check.
  // The middleware only guarantees the user is logged in.

  return response
}

// Protect page routes — API routes and static assets are excluded
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/).*)'],
}
