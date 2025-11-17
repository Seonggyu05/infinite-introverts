'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<string>('--:--:--')
  const [showWarning, setShowWarning] = useState(false)
  const [warningLevel, setWarningLevel] = useState<'none' | '10min' | '5min' | '1min'>('none')
  const supabase = createClient()

  useEffect(() => {
    const fetchNextReset = async () => {
      const { data } = await supabase.from('world_state').select('next_reset_at').eq('id', 1).single()

      if (data) {
        return new Date(data.next_reset_at)
      }
      return null
    }

    let nextResetTime: Date | null = null

    const initTimer = async () => {
      nextResetTime = await fetchNextReset()
    }

    initTimer()

    const interval = setInterval(() => {
      if (!nextResetTime) return

      const now = new Date().getTime()
      const resetTime = nextResetTime.getTime()
      const diff = resetTime - now

      if (diff <= 0) {
        // Reset happened
        setTimeLeft('00:00:00')
        window.location.href = '/maintenance'
        return
      }

      // Calculate time components
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)

      // Check warning levels
      const minutesLeft = diff / (1000 * 60)

      if (minutesLeft <= 1) {
        setWarningLevel('1min')
        setShowWarning(true)
      } else if (minutesLeft <= 5) {
        if (warningLevel !== '5min') {
          setWarningLevel('5min')
          setShowWarning(true)
        }
      } else if (minutesLeft <= 10) {
        if (warningLevel !== '10min') {
          setWarningLevel('10min')
          setShowWarning(true)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [supabase, warningLevel])

  return (
    <>
      {/* Countdown timer */}
      <div className="fixed top-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 border border-gray-200 z-50">
        <div className="text-xs text-gray-600">Next Reset</div>
        <div className="text-lg font-mono font-bold text-gray-900">{timeLeft}</div>
      </div>

      {/* Warning modals */}
      {showWarning && warningLevel === '10min' && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <p className="font-semibold">⚠️ 10 minutes until world reset!</p>
          <button
            onClick={() => setShowWarning(false)}
            className="mt-2 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {showWarning && warningLevel === '5min' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-orange-500 text-white p-6 rounded-lg shadow-xl max-w-md">
            <h3 className="text-xl font-bold mb-2">⚠️ 5 Minutes Warning!</h3>
            <p className="mb-4">The world will reset in 5 minutes. All data will be deleted.</p>
            <button
              onClick={() => setShowWarning(false)}
              className="bg-white text-orange-500 px-4 py-2 rounded font-semibold hover:bg-gray-100"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {showWarning && warningLevel === '1min' && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-red-600 text-white p-8 rounded-lg shadow-xl max-w-md text-center">
            <h3 className="text-3xl font-bold mb-4">🚨 FINAL WARNING 🚨</h3>
            <p className="text-xl mb-6">World reset in {timeLeft}</p>
            <p className="text-sm">Please finish your conversations and save any important thoughts.</p>
          </div>
        </div>
      )}
    </>
  )
}
