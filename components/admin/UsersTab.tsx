'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  nickname: string
  is_admin: boolean
  created_at: string
  last_active_at: string
}

interface UsersTabProps {
  currentUserId: string
}

export function UsersTab({ currentUserId }: UsersTabProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProfiles(data)
      }
      setLoading(false)
    }

    fetchProfiles()
  }, [supabase])

  const handleDeleteUser = async (userId: string, nickname: string) => {
    if (!confirm(`Are you sure you want to delete user "${nickname}"? This will delete all their content.`)) {
      return
    }

    const { error } = await supabase.from('profiles').delete().eq('id', userId)

    if (!error) {
      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: currentUserId,
        action_type: 'delete_user',
        target_id: userId,
        details: `Deleted user: ${nickname}`,
      })

      setProfiles((prev) => prev.filter((p) => p.id !== userId))
      alert('User deleted successfully')
    } else {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading users...</div>
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 mb-4">Total Users: {profiles.length}</div>
      {profiles.map((profile) => {
        const createdAt = new Date(profile.created_at)
        const lastActive = profile.last_active_at ? new Date(profile.last_active_at) : null

        return (
          <div key={profile.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900">
                  {profile.nickname}
                  {profile.is_admin && (
                    <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                      ADMIN
                    </span>
                  )}
                </h4>
                <p className="text-xs text-gray-500">ID: {profile.id.substring(0, 8)}...</p>
              </div>
              {profile.id !== currentUserId && (
                <button
                  onClick={() => handleDeleteUser(profile.id, profile.nickname)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="text-xs text-gray-600">
              <p>Created: {createdAt.toLocaleString()}</p>
              <p>Last Active: {lastActive ? lastActive.toLocaleString() : 'Never'}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
