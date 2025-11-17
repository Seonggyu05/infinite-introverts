'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CommentInput } from './CommentInput'
import { useLikes } from '@/lib/hooks/useLikes'

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: {
    nickname: string
  }
}

interface CommentItemProps {
  comment: Comment
  thoughtId: string
  currentUserId: string
  l2Comments?: Comment[]
  isL2?: boolean
}

export function CommentItem({ comment, thoughtId, currentUserId, l2Comments = [], isL2 = false }: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()
  const { likeCount, hasLiked, toggleLike } = useLikes(comment.id, currentUserId)

  const isOwner = comment.user_id === currentUserId
  const createdAt = new Date(comment.created_at)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setIsDeleting(true)
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', comment.id)

    if (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
      setIsDeleting(false)
    }
  }

  return (
    <div className={`${isL2 ? 'ml-8 mt-2' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-start justify-between mb-1">
          <div>
            <span className="font-medium text-sm text-gray-900">{comment.profiles.nickname}</span>
            <span className="text-xs text-gray-500 ml-2">{createdAt.toLocaleString()}</span>
          </div>
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-red-500 hover:text-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>

        <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{comment.content}</p>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 ${hasLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-600`}
          >
            <span>{hasLiked ? '❤️' : '🤍'}</span>
            <span>{likeCount}</span>
          </button>

          {!isL2 && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-gray-500 hover:text-blue-600"
            >
              Reply
            </button>
          )}
        </div>
      </div>

      {/* L2 reply input */}
      {!isL2 && showReplyInput && (
        <div className="ml-8 mt-2">
          <CommentInput
            thoughtId={thoughtId}
            userId={currentUserId}
            parentCommentId={comment.id}
            onCommentAdded={() => setShowReplyInput(false)}
          />
        </div>
      )}

      {/* L2 comments */}
      {!isL2 && l2Comments.length > 0 && (
        <div className="mt-2">
          {l2Comments.map((l2Comment) => (
            <CommentItem
              key={l2Comment.id}
              comment={l2Comment}
              thoughtId={thoughtId}
              currentUserId={currentUserId}
              isL2
            />
          ))}
        </div>
      )}
    </div>
  )
}
