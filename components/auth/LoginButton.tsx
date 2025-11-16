'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginButton() {
  const [mode, setMode] = useState<'select' | 'login' | 'signup'>('select')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        // Check if email confirmation is disabled
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          router.refresh()
        } else {
          setError('Please check your email to confirm your account')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'select') {
    return (
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setMode('signup')}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:bg-purple-700 transition-all"
        >
          Sign Up
        </button>
        <button
          onClick={() => setMode('login')}
          className="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
        >
          Login
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={mode === 'signup' ? handleSignUp : handleSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {mode === 'signup' ? 'Signing up...' : 'Signing in...'}
            </div>
          ) : (
            mode === 'signup' ? 'Sign Up' : 'Login'
          )}
        </button>

        <button
          type="button"
          onClick={() => setMode('select')}
          className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
      </form>
    </div>
  )
}
