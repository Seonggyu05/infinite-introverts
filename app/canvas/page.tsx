'use client'

import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NicknameModal } from '@/components/auth/NicknameModal'

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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setShowNicknameModal(true)
      } else {
        setProfile(profile)
      }

      setLoading(false)
    }

    checkAuth()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

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
    <div className="h-screen w-screen bg-gray-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Infinite Introverts</h1>
          {profile && (
            <p className="text-sm text-gray-600">
              Welcome, <span className="font-medium">{profile.nickname}</span>
            </p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
        >
          Logout
        </button>
      </div>

      {/* Canvas */}
      <div className="w-full h-full pt-16">
        <InfiniteCanvas>
          {/* Avatar and other canvas elements will go here in Phase 3 */}
        </InfiniteCanvas>
      </div>
    </div>
  )
}
