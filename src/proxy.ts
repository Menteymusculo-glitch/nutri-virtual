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

  // Invitaciones (Stripe/DAX): la alumna aún no tiene sesión; la página verifica
  // el token_hash con verifyOtp y la inicia.
  if (pathname === '/bienvenida') {
    return response
  }

  // /nutrivirtual → alias for the nutrition tool landing (moved off '/' when
  // '/' became the public marketing homepage)
  if (pathname === '/nutrivirtual') {
    return NextResponse.redirect(new URL('/plan-nutricional', request.url))
  }

  // Public marketing homepage — no login required. Logged-in users see a
  // "go to my dashboard" CTA instead of the sales pitch (handled in the page).
  if (pathname === '/') {
    return response
  }

  // Public lead-magnet pages — no login required
  if (pathname === '/quiz-identidad' || pathname === '/calculadora-grasa') {
    return response
  }

  // Public legal pages — no login required
  if (pathname === '/privacidad' || pathname === '/terminos' || pathname === '/fuentes') {
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
