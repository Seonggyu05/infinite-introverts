'use client'

import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { NicknameModal } from '@/components/auth/NicknameModal'
import { ThoughtInput } from '@/components/thoughts/ThoughtInput'
import { OpenChat } from '@/components/chat/OpenChat'
import { PrivateChatPanel } from '@/components/chat/PrivateChatPanel'
import { CountdownTimer } from '@/components/reset/CountdownTimer'
import { AdminPanel } from '@/components/admin/AdminPanel'

// Dynamic import to prevent SSR issues with Konva
const InfiniteCanvas = dynamic(
  () => import('@/components/canvas/InfiniteCanvas').then(mod => ({ default: mod.InfiniteCanvas })),
  { ssr: false }
)

export default function CanvasPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })
  const [profiles, setProfiles] = useState<any[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      setUser(user)

      // Check if profile exists
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile || error) {
        setShowNicknameModal(true)
      } else {
        setProfile(profile)
        setCurrentPosition({ x: profile.position_x, y: profile.position_y })
      }

      setLoading(false)
    }

    checkAuth()
  }, [supabase, router])

  // Fetch profiles for chat connectors
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, position_x, position_y')

      if (data) {
        setProfiles(data)
      }
    }

    fetchProfiles()

    // Subscribe to profile updates
    const channel = supabase
      .channel('profile-positions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          fetchProfiles()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handlePositionChange = useCallback((position: { x: number; y: number }) => {
    setCurrentPosition(position)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading canvas...</p>
        </div>
      </div>
    )
  }

  if (showNicknameModal && user) {
    return (
      <NicknameModal
        userId={user.id}
        onComplete={() => {
          setShowNicknameModal(false)
          window.location.reload()
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-white">
      {/* Canvas */}
      <div className="absolute inset-0">
        {profile && (
          <InfiniteCanvas
            currentUserId={user.id}
            currentUserNickname={profile.nickname}
            onCurrentPositionChange={handlePositionChange}
            profiles={profiles}
          />
        )}
      </div>

      {/* Countdown Timer */}
      <CountdownTimer />

      {/* Thought Input */}
      {profile && (
        <ThoughtInput
          userId={user.id}
          currentPosition={currentPosition}
        />
      )}

      {/* Open Chat */}
      {profile && (
        <OpenChat
          currentUserId={user.id}
          isAdmin={profile.is_admin || false}
        />
      )}

      {/* Private Chat Panel */}
      {profile && <PrivateChatPanel currentUserId={user.id} />}

      {/* Admin Panel (only visible to admins) */}
      {profile && profile.is_admin && <AdminPanel currentUserId={user.id} />}

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm shadow-lg z-40"
      >
        Logout
      </button>
    </div>
  )
}
