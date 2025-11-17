'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ChatMessage {
  id: string
  message: string
  created_at: string
  profiles: {
    nickname: string
  }
}

interface ChatTabProps {
  currentUserId: string
}

export function ChatTab({ currentUserId }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('open_chat')
        .select(`
          *,
          profiles (
            nickname
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (!error && data) {
        setMessages(data)
      }
      setLoading(false)
    }

    fetchMessages()
  }, [supabase])

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    const { error } = await supabase.from('open_chat').delete().eq('id', messageId)

    if (!error) {
      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: currentUserId,
        action_type: 'delete_chat_message',
        target_id: messageId,
        details: 'Deleted open chat message',
      })

      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      alert('Message deleted successfully')
    } else {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading messages...</div>
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 mb-4">Total Messages: {messages.length}</div>
      {messages.length === 0 ? (
        <div className="text-center text-gray-400 py-4">No messages found</div>
      ) : (
        messages.map((msg) => {
          const createdAt = new Date(msg.created_at)

          return (
            <div key={msg.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{msg.profiles.nickname}</h4>
                  <p className="text-xs text-gray-500">{createdAt.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
              <p className="text-sm text-gray-700">{msg.message}</p>
            </div>
          )
        })
      )}
    </div>
  )
}
