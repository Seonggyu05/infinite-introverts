'use client'

import { LoginButton } from '@/components/auth/LoginButton'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsAuthenticated(true)
        router.push('/canvas')
      }
      setLoading(false)
    }

    checkAuth()
  }, [supabase, router])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </main>
    )
  }

  if (isAuthenticated) {
    return null // Redirecting...
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Infinite Introverts
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Ephemeral canvas for quiet conversations
        </p>

        <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg max-w-md mx-auto">
          <ul className="text-left space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-2xl">🎨</span>
              <span>Infinite canvas to explore and interact</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">💭</span>
              <span>Share ephemeral thoughts that reset every 24 hours</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">👥</span>
              <span>See others in real-time as stick figures</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <span>Private and public conversations</span>
            </li>
          </ul>
        </div>

        <LoginButton />

        <p className="mt-8 text-sm text-gray-500">
          Everything resets at midnight UTC ⏰
        </p>
      </div>
    </main>
  )
}
