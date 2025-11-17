'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  sender_id: string
  message: string
  created_at: string
  is_read: boolean
}

interface PrivateChatWindowProps {
  chatId: string
  currentUserId: string
  onClose: () => void
}

export function PrivateChatWindow({ chatId, currentUserId, onClose }: PrivateChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [otherUserNickname, setOtherUserNickname] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchChatInfo = async () => {
      // Get chat details
      const { data: chat } = await supabase
        .from('private_chats')
        .select(`
          *,
          user1:profiles!private_chats_user1_id_fkey(nickname),
          user2:profiles!private_chats_user2_id_fkey(nickname)
        `)
        .eq('id', chatId)
        .single()

      if (chat) {
        const otherUser = chat.user1_id === currentUserId ? chat.user2 : chat.user1
        setOtherUserNickname(otherUser.nickname)
      }

      // Get messages
      const { data: msgs } = await supabase
        .from('private_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (msgs) {
        setMessages(msgs)
        setTimeout(scrollToBottom, 100)

        // Mark messages as read
        const unreadIds = msgs
          .filter((m) => !m.is_read && m.sender_id !== currentUserId)
          .map((m) => m.id)

        if (unreadIds.length > 0) {
          await supabase
            .from('private_messages')
            .update({ is_read: true })
            .in('id', unreadIds)
        }
      }
    }

    fetchChatInfo()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`private-messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
          setTimeout(scrollToBottom, 100)

          // Mark as read if not from current user
          if (payload.new.sender_id !== currentUserId) {
            supabase
              .from('private_messages')
              .update({ is_read: true })
              .eq('id', payload.new.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, chatId, currentUserId])

  const handleSend = async () => {
    if (!newMessage.trim()) return

    setIsSending(true)

    try {
      const { error } = await supabase.from('private_messages').insert({
        chat_id: chatId,
        sender_id: currentUserId,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-blue-50">
          <h3 className="font-semibold text-gray-900">Chat with {otherUserNickname}</h3>
          <button onClick={onClose} className="text-gray-500 text-2xl font-bold">
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-4">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === currentUserId
              const createdAt = new Date(msg.created_at)

              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`px-4 py-2 rounded-lg max-w-[70%] ${
                      isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                      {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isSending}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
            />
            <button
              onClick={handleSend}
              disabled={isSending || !newMessage.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:bg-gray-300"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
