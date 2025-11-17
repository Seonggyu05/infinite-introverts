'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { COMMENT_MAX_CHARS } from '@/lib/constants/limits'

interface CommentInputProps {
  thoughtId: string
  userId: string
  parentCommentId: string | null
  onCommentAdded?: () => void
}

export function CommentInput({ thoughtId, userId, parentCommentId, onCommentAdded }: CommentInputProps) {
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const supabase = createClient()

  const charCount = content.length
  const isOverLimit = charCount > COMMENT_MAX_CHARS

  const handlePost = async () => {
    if (!content.trim() || isOverLimit) return

    setIsPosting(true)

    try {
      // Check if parent is L2 (prevent L3)
      if (parentCommentId) {
        const { data: parentComment } = await supabase
          .from('comments')
          .select('parent_comment_id')
          .eq('id', parentCommentId)
          .single()

        if (parentComment?.parent_comment_id) {
          alert('Cannot reply to nested comments (L3 not allowed)')
          setIsPosting(false)
          return
        }
      }

      const { error } = await supabase.from('comments').insert({
        thought_id: thoughtId,
        user_id: userId,
        content: content.trim(),
        parent_comment_id: parentCommentId,
      })

      if (error) throw error

      setContent('')
      onCommentAdded?.()
    } catch (err) {
      console.error('Error posting comment:', err)
      alert('Failed to post comment')
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
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={parentCommentId ? 'Write a reply...' : 'Add a comment...'}
        className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        rows={2}
        disabled={isPosting}
      />
      <div className="flex items-center justify-between mt-1">
        <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
          {charCount} / {COMMENT_MAX_CHARS}
        </span>
        <button
          onClick={handlePost}
          disabled={isPosting || !content.trim() || isOverLimit}
          className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 disabled:bg-gray-300"
        >
          {isPosting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}
