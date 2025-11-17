'use client'

import { useEffect, useState } from 'react'
import { Line } from 'react-konva'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  position_x: number
  position_y: number
}

interface ChatConnection {
  id: string
  user1_id: string
  user2_id: string
  status: 'accepted'
}

interface ChatConnectorsProps {
  currentUserId: string
  profiles: Profile[]
}

export function ChatConnectors({ profiles }: ChatConnectorsProps) {
  const [connections, setConnections] = useState<ChatConnection[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchConnections = async () => {
      const { data } = await supabase
        .from('private_chats')
        .select('id, user1_id, user2_id, status')
        .eq('status', 'accepted')

      if (data) {
        setConnections(data)
      }
    }

    fetchConnections()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('chat-connections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_chats',
        },
        () => {
          fetchConnections()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  return (
    <>
      {connections.map((conn) => {
        const user1 = profileMap.get(conn.user1_id)
        const user2 = profileMap.get(conn.user2_id)

        if (!user1 || !user2) return null

        // Calculate distance
        const dx = user2.position_x - user1.position_x
        const dy = user2.position_y - user1.position_y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Don't render if too far apart
        if (distance > 2000) return null

        // Calculate opacity based on distance (100% at 0px, 0% at 2000px)
        const opacity = Math.max(0, 1 - distance / 2000)

        return (
          <Line
            key={conn.id}
            points={[user1.position_x, user1.position_y, user2.position_x, user2.position_y]}
            stroke="#22c55e"
            strokeWidth={2}
            opacity={opacity}
            listening={false}
          />
        )
      })}
    </>
  )
}
