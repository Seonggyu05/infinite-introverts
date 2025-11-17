'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ChatMessage {
  id: string
  user_id: string
  message: string
  created_at: string
  profiles: {
    nickname: string
  }
}

interface OpenChatProps {
  currentUserId: string
  isAdmin: boolean
}

export function OpenChat({ currentUserId, isAdmin }: OpenChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
        .order('created_at', { ascending: true })
        .limit(100)

      if (!error && data) {
        setMessages(data)
        setTimeout(scrollToBottom, 100)
      }
    }

    fetchMessages()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('open-chat')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'open_chat',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('open_chat')
              .select(`
                *,
                profiles (
                  nickname
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setMessages((prev) => [...prev, data])
              setTimeout(scrollToBottom, 100)
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleSend = async () => {
    if (!newMessage.trim()) return

    setIsSending(true)

    try {
      const { error } = await supabase.from('open_chat').insert({
        user_id: currentUserId,
        message: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!isAdmin) return
    if (!confirm('Delete this message?')) return

    await supabase.from('open_chat').delete().eq('id', messageId)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-4 left-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div
        className="p-3 border-b border-gray-200 flex items-center justify-between cursor-pointer bg-blue-50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="font-semibold text-gray-900">Open Chat</h3>
        <button className="text-gray-500 text-xl">{isCollapsed ? '▲' : '▼'}</button>
      </div>

      {!isCollapsed && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-80">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-4">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.user_id === currentUserId
                const createdAt = new Date(msg.created_at)

                return (
                  <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs font-medium text-gray-700">{msg.profiles.nickname}</span>
                      <span className="text-xs text-gray-400">
                        {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="text-xs text-red-500 hover:text-red-700 ml-1"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-lg text-sm max-w-[85%] ${
                        isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={isSending}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={500}
              />
              <button
                onClick={handleSend}
                disabled={isSending || !newMessage.trim()}
                className="px-4 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:bg-gray-300"
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
