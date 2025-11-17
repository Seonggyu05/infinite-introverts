'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CommentItem } from './CommentItem'

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  parent_comment_id: string | null
  profiles: {
    nickname: string
  }
}

interface CommentListProps {
  thoughtId: string
  currentUserId: string
}

export function CommentList({ thoughtId, currentUserId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            nickname
          )
        `)
        .eq('thought_id', thoughtId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setComments(data)
      }
      setLoading(false)
    }

    fetchComments()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`comments-${thoughtId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `thought_id=eq.${thoughtId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the new comment with profile data
            supabase
              .from('comments')
              .select(`
                *,
                profiles (
                  nickname
                )
              `)
              .eq('id', payload.new.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setComments((prev) => [...prev, data])
                }
              })
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, thoughtId])

  if (loading) {
    return <div className="text-center text-gray-500 text-sm">Loading comments...</div>
  }

  // Organize comments into L1 and L2 structure
  const l1Comments = comments.filter((c) => !c.parent_comment_id)

  if (l1Comments.length === 0) {
    return <div className="text-center text-gray-400 text-sm">No comments yet. Be the first!</div>
  }

  return (
    <div className="space-y-4">
      {l1Comments.map((comment) => {
        const l2Comments = comments.filter((c) => c.parent_comment_id === comment.id)
        return (
          <CommentItem
            key={comment.id}
            comment={comment}
            thoughtId={thoughtId}
            currentUserId={currentUserId}
            l2Comments={l2Comments}
          />
        )
      })}
    </div>
  )
}
