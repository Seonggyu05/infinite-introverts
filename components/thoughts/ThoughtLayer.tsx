'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThoughtBubble } from './ThoughtBubble'
import { ThoughtDetailModal } from './ThoughtDetailModal'

interface Thought {
  id: string
  user_id: string
  content: string
  position_x: number
  position_y: number
  created_at: string
  is_hidden: boolean
  profiles: {
    nickname: string
  }
  _count?: {
    comments: number
  }
}

interface ThoughtLayerProps {
  currentUserId: string
}

export function ThoughtLayer({ currentUserId }: ThoughtLayerProps) {
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchThoughts = async () => {
      const { data, error } = await supabase
        .from('thoughts')
        .select(`
          *,
          profiles (
            nickname
          )
        `)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })

      if (!error && data) {
        // Fetch comment counts for each thought
        const thoughtsWithCounts = await Promise.all(
          data.map(async (thought) => {
            const { count } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('thought_id', thought.id)

            return {
              ...thought,
              _count: { comments: count || 0 },
            }
          })
        )
        setThoughts(thoughtsWithCounts)
      }
    }

    fetchThoughts()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('thoughts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thoughts',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('thoughts')
              .select(`
                *,
                profiles (
                  nickname
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (data && !data.is_hidden) {
              const { count } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('thought_id', data.id)

              setThoughts((prev) => [{ ...data, _count: { comments: count || 0 } }, ...prev])
            }
          } else if (payload.eventType === 'DELETE') {
            setThoughts((prev) => prev.filter((t) => t.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.is_hidden) {
              setThoughts((prev) => prev.filter((t) => t.id !== payload.new.id))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <>
      {thoughts.map((thought) => (
        <ThoughtBubble
          key={thought.id}
          id={thought.id}
          x={thought.position_x}
          y={thought.position_y}
          content={thought.content}
          authorNickname={thought.profiles.nickname}
          commentCount={thought._count?.comments || 0}
          onClick={() => setSelectedThoughtId(thought.id)}
        />
      ))}

      {selectedThoughtId && (
        <ThoughtDetailModal
          thoughtId={selectedThoughtId}
          currentUserId={currentUserId}
          onClose={() => setSelectedThoughtId(null)}
        />
      )}
    </>
  )
}
