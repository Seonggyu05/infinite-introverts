'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SystemTabProps {
  currentUserId: string
}

export function SystemTab({ currentUserId }: SystemTabProps) {
  const [isResetting, setIsResetting] = useState(false)
  const [password, setPassword] = useState('')
  const [nextReset, setNextReset] = useState<Date | null>(null)
  const [resetCount, setResetCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const fetchWorldState = async () => {
      const { data } = await supabase.from('world_state').select('*').eq('id', 1).single()

      if (data) {
        setNextReset(new Date(data.next_reset_at))
        setResetCount(data.reset_count || 0)
      }
    }

    fetchWorldState()
  }, [supabase])

  const handleManualReset = async () => {
    if (password !== 'RESET_WORLD') {
      alert('Incorrect password')
      return
    }

    if (!confirm('Are you ABSOLUTELY SURE you want to reset the world? This will delete ALL data!')) {
      return
    }

    setIsResetting(true)

    try {
      const { error } = await supabase.rpc('reset_world')

      if (error) throw error

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: currentUserId,
        action_type: 'manual_reset',
        details: 'Manual world reset',
      })

      alert('World reset successfully! Refreshing page...')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      console.error('Error resetting world:', err)
      alert('Failed to reset world. Check console for details.')
    } finally {
      setIsResetting(false)
      setPassword('')
    }
  }

  return (
    <div className="space-y-6">
      {/* World Status */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-2">World Status</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>Next Auto Reset: {nextReset ? nextReset.toLocaleString() : 'Loading...'}</p>
          <p>Total Resets: {resetCount}</p>
        </div>
      </div>

      {/* Manual Reset */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h3 className="font-semibold text-red-900 mb-2">⚠️ Manual World Reset</h3>
        <p className="text-sm text-gray-700 mb-4">
          This will permanently delete all data: users, thoughts, comments, and chat messages.
          Type <strong>RESET_WORLD</strong> to confirm.
        </p>
        <div className="space-y-3">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type RESET_WORLD"
            className="w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={handleManualReset}
            disabled={isResetting || password !== 'RESET_WORLD'}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isResetting ? 'Resetting...' : 'Reset World Now'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Reset Function</h3>
        <p className="text-xs text-gray-600">
          The reset function should be created in Supabase as a stored procedure. Make sure
          the `reset_world()` function exists in your database schema.
        </p>
      </div>
    </div>
  )
}
