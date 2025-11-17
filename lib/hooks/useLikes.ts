import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useLikes(commentId: string, userId: string) {
  const [likeCount, setLikeCount] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchLikes = async () => {
      // Get total like count
      const { count } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId)

      setLikeCount(count || 0)

      // Check if current user has liked
      const { data } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .single()

      setHasLiked(!!data)
    }

    fetchLikes()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`likes-${commentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_likes',
          filter: `comment_id=eq.${commentId}`,
        },
        () => {
          fetchLikes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, commentId, userId])

  const toggleLike = async () => {
    if (isToggling) return

    setIsToggling(true)

    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId)
      } else {
        // Like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: userId,
          })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsToggling(false)
    }
  }

  return { likeCount, hasLiked, toggleLike }
}
