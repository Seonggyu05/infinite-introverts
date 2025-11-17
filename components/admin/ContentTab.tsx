'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Thought {
  id: string
  content: string
  is_hidden: boolean
  created_at: string
  profiles: {
    nickname: string
  }
}

interface ContentTabProps {
  currentUserId: string
}

export function ContentTab({ currentUserId }: ContentTabProps) {
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'hidden' | 'visible'>('all')
  const supabase = createClient()

  useEffect(() => {
    const fetchThoughts = async () => {
      let query = supabase
        .from('thoughts')
        .select(`
          *,
          profiles (
            nickname
          )
        `)
        .order('created_at', { ascending: false })

      if (filter === 'hidden') {
        query = query.eq('is_hidden', true)
      } else if (filter === 'visible') {
        query = query.eq('is_hidden', false)
      }

      const { data, error } = await query

      if (!error && data) {
        setThoughts(data)
      }
      setLoading(false)
    }

    fetchThoughts()
  }, [supabase, filter])

  const handleDeleteThought = async (thoughtId: string) => {
    if (!confirm('Are you sure you want to delete this thought?')) return

    const { error } = await supabase.from('thoughts').delete().eq('id', thoughtId)

    if (!error) {
      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: currentUserId,
        action_type: 'delete_thought',
        target_id: thoughtId,
        details: 'Deleted thought',
      })

      setThoughts((prev) => prev.filter((t) => t.id !== thoughtId))
      alert('Thought deleted successfully')
    } else {
      console.error('Error deleting thought:', error)
      alert('Failed to delete thought')
    }
  }

  const handleToggleHidden = async (thoughtId: string, currentlyHidden: boolean) => {
    const { error } = await supabase
      .from('thoughts')
      .update({ is_hidden: !currentlyHidden })
      .eq('id', thoughtId)

    if (!error) {
      setThoughts((prev) =>
        prev.map((t) => (t.id === thoughtId ? { ...t, is_hidden: !currentlyHidden } : t))
      )
    } else {
      console.error('Error toggling hidden status:', error)
      alert('Failed to update thought')
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading thoughts...</div>
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          All ({thoughts.length})
        </button>
        <button
          onClick={() => setFilter('visible')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'visible' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Visible
        </button>
        <button
          onClick={() => setFilter('hidden')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'hidden' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Hidden
        </button>
      </div>

      {/* Thoughts list */}
      <div className="space-y-2">
        {thoughts.length === 0 ? (
          <div className="text-center text-gray-400 py-4">No thoughts found</div>
        ) : (
          thoughts.map((thought) => {
            const createdAt = new Date(thought.created_at)

            return (
              <div key={thought.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {thought.profiles.nickname}
                      {thought.is_hidden && (
                        <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">
                          HIDDEN
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-500">{createdAt.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleHidden(thought.id, thought.is_hidden)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                    >
                      {thought.is_hidden ? 'Unhide' : 'Hide'}
                    </button>
                    <button
                      onClick={() => handleDeleteThought(thought.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{thought.content}</p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
