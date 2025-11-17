'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CommentList } from './CommentList'
import { CommentInput } from './CommentInput'

interface Thought {
  id: string
  user_id: string
  content: string
  position_x: number
  position_y: number
  created_at: string
  profiles: {
    nickname: string
  }
}

interface ThoughtDetailModalProps {
  thoughtId: string
  currentUserId: string
  onClose: () => void
}

export function ThoughtDetailModal({ thoughtId, currentUserId, onClose }: ThoughtDetailModalProps) {
  const [thought, setThought] = useState<Thought | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchThought = async () => {
      const { data, error } = await supabase
        .from('thoughts')
        .select(`
          *,
          profiles (
            nickname
          )
        `)
        .eq('id', thoughtId)
        .single()

      if (!error && data) {
        setThought(data)
      }
      setLoading(false)
    }

    fetchThought()
  }, [supabase, thoughtId])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this thought?')) return

    setIsDeleting(true)
    const { error } = await supabase
      .from('thoughts')
      .delete()
      .eq('id', thoughtId)

    if (!error) {
      onClose()
    } else {
      console.error('Error deleting thought:', error)
      alert('Failed to delete thought')
    }
    setIsDeleting(false)
  }

  const handleReport = async () => {
    const { data: existingReport } = await supabase
      .from('spam_reports')
      .select('id')
      .eq('thought_id', thoughtId)
      .eq('reporter_id', currentUserId)
      .single()

    if (existingReport) {
      alert('You have already reported this thought')
      return
    }

    const { error } = await supabase
      .from('spam_reports')
      .insert({
        thought_id: thoughtId,
        reporter_id: currentUserId,
      })

    if (!error) {
      alert('Thought reported. Thank you for helping keep the canvas clean!')
    } else {
      console.error('Error reporting thought:', error)
      alert('Failed to report thought')
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!thought) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center text-red-500">Thought not found</div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md w-full"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const isOwner = thought.user_id === currentUserId
  const createdAt = new Date(thought.created_at)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {thought.profiles.nickname}
            </h3>
            <p className="text-xs text-gray-500">
              {createdAt.toLocaleString()} • Position ({Math.round(thought.position_x)}, {Math.round(thought.position_y)})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 border-b border-gray-200">
          <p className="text-gray-800 whitespace-pre-wrap">{thought.content}</p>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-gray-200 flex gap-2">
          {isOwner ? (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 disabled:bg-gray-300"
            >
              {isDeleting ? 'Deleting...' : 'Delete Thought'}
            </button>
          ) : (
            <button
              onClick={handleReport}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
            >
              Report Spam
            </button>
          )}
        </div>

        {/* Comments section */}
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Comments</h4>
          <CommentList thoughtId={thoughtId} currentUserId={currentUserId} />
        </div>

        {/* Comment input */}
        <div className="p-4 border-t border-gray-200">
          <CommentInput
            thoughtId={thoughtId}
            userId={currentUserId}
            parentCommentId={null}
          />
        </div>
      </div>
    </div>
  )
}
