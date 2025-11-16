import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth Callback Route
 * Handles OAuth callback from Supabase Auth
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Check if user has a profile and redirect accordingly
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      // Redirect to canvas regardless - if no profile, canvas will show nickname modal
      return NextResponse.redirect(`${origin}/canvas`)
    }
  }

  // Redirect to home page if no code or auth failed
  return NextResponse.redirect(`${origin}/`)
}
