'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { THOUGHT_MAX_CHARS, MAX_THOUGHTS_PER_USER, THOUGHT_RATE_LIMIT_MS } from '@/lib/constants/limits'

interface ThoughtInputProps {
  userId: string
  currentPosition: { x: number; y: number }
  onThoughtPosted?: () => void
}

export function ThoughtInput({ userId, currentPosition, onThoughtPosted }: ThoughtInputProps) {
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [lastPostTime, setLastPostTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const charCount = content.length
  const isOverLimit = charCount > THOUGHT_MAX_CHARS

  const handlePost = async () => {
    if (!content.trim()) return
    if (isOverLimit) return

    // Rate limiting check
    const now = Date.now()
    if (now - lastPostTime < THOUGHT_RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((THOUGHT_RATE_LIMIT_MS - (now - lastPostTime)) / 1000)
      setError(`Please wait ${remainingSeconds} seconds before posting again`)
      return
    }

    setIsPosting(true)
    setError(null)

    try {
      // Check thought count limit
      const { data: existingThoughts, error: countError } = await supabase
        .from('thoughts')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (countError) throw countError

      // Delete oldest thought if limit exceeded
      if (existingThoughts && existingThoughts.length >= MAX_THOUGHTS_PER_USER) {
        const oldestThoughtId = existingThoughts[0].id
        await supabase.from('thoughts').delete().eq('id', oldestThoughtId)
      }

      // Create new thought
      const { error: insertError } = await supabase.from('thoughts').insert({
        user_id: userId,
        content: content.trim(),
        position_x: currentPosition.x,
        position_y: currentPosition.y,
      })

      if (insertError) throw insertError

      // Success
      setContent('')
      setLastPostTime(now)
      onThoughtPosted?.()
    } catch (err) {
      console.error('Error posting thought:', err)
      setError('Failed to post thought. Please try again.')
    } finally {
      setIsPosting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handlePost()
    }
  }

  return (
    <div className="fixed top-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-50">
      <div className="mb-2">
        <label className="text-sm font-medium text-gray-700 block mb-1">
          What&apos;s on your mind?
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share a thought... (Shift+Enter for new line)"
          className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          rows={3}
          disabled={isPosting}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
          {charCount} / {THOUGHT_MAX_CHARS}
        </span>
        <button
          onClick={handlePost}
          disabled={isPosting || !content.trim() || isOverLimit}
          className="px-4 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isPosting ? 'Posting...' : 'Post'}
        </button>
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-500">
          {error}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-400">
        Posted at your current location ({Math.round(currentPosition.x)}, {Math.round(currentPosition.y)})
      </div>
    </div>
  )
}
