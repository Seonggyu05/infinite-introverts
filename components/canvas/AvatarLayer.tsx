'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StickFigure } from './StickFigure'
import { PERFORMANCE, clampToBounds } from '@/lib/constants/canvas'
import { throttle, debounce } from 'lodash'

interface Profile {
  id: string
  nickname: string
  position_x: number
  position_y: number
  last_active_at: string
}

interface AvatarLayerProps {
  currentUserId: string
  currentUserNickname: string
}

export function AvatarLayer({ currentUserId, currentUserNickname }: AvatarLayerProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUserPosition, setCurrentUserPosition] = useState({ x: 0, y: 0 })
  const supabase = createClient()

  // Fetch initial profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, position_x, position_y, last_active_at')

      if (data && !error) {
        setProfiles(data)

        // Set current user's position
        const currentUser = data.find(p => p.id === currentUserId)
        if (currentUser) {
          setCurrentUserPosition({
            x: currentUser.position_x,
            y: currentUser.position_y,
          })
        }
      }
    }

    fetchProfiles()
  }, [supabase, currentUserId])

  // Set up real-time subscription for profile changes
  useEffect(() => {
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProfiles(prev => [...prev, payload.new as Profile])
          } else if (payload.eventType === 'UPDATE') {
            setProfiles(prev =>
              prev.map(p => (p.id === payload.new.id ? payload.new as Profile : p))
            )
          } else if (payload.eventType === 'DELETE') {
            setProfiles(prev => prev.filter(p => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Set up presence system
  useEffect(() => {
    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        console.log('Online users:', Object.keys(state))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: currentUserId,
            nickname: currentUserNickname,
            online_at: new Date().toISOString(),
          })
        }
      })

    // Update last_active_at every 30 seconds
    const heartbeatInterval = setInterval(async () => {
      await supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', currentUserId)
    }, 30000)

    return () => {
      clearInterval(heartbeatInterval)
      presenceChannel.unsubscribe()
    }
  }, [supabase, currentUserId, currentUserNickname])

  // Throttled position broadcast
  const broadcastPosition = useCallback((x: number, y: number) => {
    const channel = supabase.channel('avatar-movements')
    channel.send({
      type: 'broadcast',
      event: 'position_update',
      payload: {
        user_id: currentUserId,
        x,
        y,
      },
    })
  }, [supabase, currentUserId])

  const throttledBroadcast = throttle(broadcastPosition, PERFORMANCE.POSITION_UPDATE_THROTTLE_MS)

  // Debounced database update
  const updatePositionInDB = useCallback(async (x: number, y: number) => {
    const clamped = clampToBounds(x, y)
    await supabase
      .from('profiles')
      .update({
        position_x: clamped.x,
        position_y: clamped.y,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', currentUserId)
  }, [supabase, currentUserId])

  const debouncedDBUpdate = debounce(updatePositionInDB, PERFORMANCE.POSITION_DB_UPDATE_DEBOUNCE_MS)

  // Handle avatar drag
  const handleAvatarDragEnd = (x: number, y: number) => {
    const clamped = clampToBounds(x, y)
    setCurrentUserPosition(clamped)
    throttledBroadcast(clamped.x, clamped.y)
    debouncedDBUpdate(clamped.x, clamped.y)
  }

  // Listen for position updates from other users
  useEffect(() => {
    const movementChannel = supabase
      .channel('avatar-movements')
      .on('broadcast', { event: 'position_update' }, (payload) => {
        const { user_id, x, y } = payload.payload

        if (user_id !== currentUserId) {
          setProfiles(prev =>
            prev.map(p => (p.id === user_id ?
              { ...p, position_x: x, position_y: y } :
              p))
          )
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(movementChannel)
    }
  }, [supabase, currentUserId])

  const activeProfiles = profiles;

  return (
    <>
      {activeProfiles.map(profile => {
        const isCurrentUser = profile.id === currentUserId
        const position = isCurrentUser ?
          currentUserPosition :
          { x: profile.position_x, y: profile.position_y }

        return (
          <StickFigure
            key={profile.id}
            x={position.x}
            y={position.y}
            nickname={profile.nickname}
            isCurrentUser={isCurrentUser}
            onDragEnd={isCurrentUser ? handleAvatarDragEnd : undefined}
          />
        )
      })}
    </>
  )
}
