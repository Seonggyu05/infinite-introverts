'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface NicknameModalProps {
  userId: string
  onComplete: () => void
}

export function NicknameModal({ userId, onComplete }: NicknameModalProps) {
  const [nickname, setNickname] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // Check nickname availability with debounce
  useEffect(() => {
    if (!nickname || nickname.length < 2) {
      setIsAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsChecking(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('nickname', nickname)
          .single()

        setIsAvailable(!data && !error)
      } catch (err) {
        setIsAvailable(false)
      } finally {
        setIsChecking(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [nickname, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nickname || nickname.length > 50 || isAvailable === false) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Random spawn position (-5000 to 5000)
      const position_x = Math.floor(Math.random() * 10000) - 5000
      const position_y = Math.floor(Math.random() * 10000) - 5000

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          nickname,
          position_x,
          position_y,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('This nickname is already taken')
          setIsAvailable(false)
        } else {
          setError('Failed to create profile. Please try again.')
        }
        return
      }

      onComplete()
      router.push('/canvas')
    } catch (err) {
      console.error('Error creating profile:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Nickname
        </h2>
        <p className="text-gray-600 mb-6">
          This is how others will see you on the canvas
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter nickname..."
              maxLength={50}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
              autoFocus
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm">
                {isChecking && (
                  <span className="text-gray-500">Checking availability...</span>
                )}
                {!isChecking && isAvailable === true && (
                  <span className="text-green-600 font-medium">✓ Available</span>
                )}
                {!isChecking && isAvailable === false && (
                  <span className="text-red-600 font-medium">✗ Already taken</span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {nickname.length}/50
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!nickname || nickname.length < 2 || isAvailable !== true || isSubmitting}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating profile...' : 'Continue to Canvas'}
          </button>
        </form>
      </div>
    </div>
  )
}
