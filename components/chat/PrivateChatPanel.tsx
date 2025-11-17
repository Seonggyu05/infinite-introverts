'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PrivateChatWindow } from './PrivateChatWindow'

interface PrivateChat {
  id: string
  user1_id: string
  user2_id: string
  status: 'pending' | 'accepted' | 'declined'
  initiated_by: string
  created_at: string
  user1: {
    nickname: string
  }
  user2: {
    nickname: string
  }
}

interface PrivateChatPanelProps {
  currentUserId: string
}

export function PrivateChatPanel({ currentUserId }: PrivateChatPanelProps) {
  const [chats, setChats] = useState<PrivateChat[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const supabase = createClient()

  useEffect(() => {
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('private_chats')
        .select(`
          *,
          user1:profiles!private_chats_user1_id_fkey(nickname),
          user2:profiles!private_chats_user2_id_fkey(nickname)
        `)
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setChats(data)

        // Fetch unread counts
        data.forEach(async (chat) => {
          const { count } = await supabase
            .from('private_messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .eq('is_read', false)
            .neq('sender_id', currentUserId)

          if (count && count > 0) {
            setUnreadCounts((prev) => ({ ...prev, [chat.id]: count }))
          }
        })
      }
    }

    fetchChats()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('private-chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_chats',
        },
        () => {
          fetchChats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, currentUserId])

  const handleAcceptChat = async (chatId: string) => {
    await supabase
      .from('private_chats')
      .update({ status: 'accepted' })
      .eq('id', chatId)
  }

  const handleDeclineChat = async (chatId: string) => {
    await supabase
      .from('private_chats')
      .update({ status: 'declined' })
      .eq('id', chatId)
  }

  const pendingRequests = chats.filter(
    (c) => c.status === 'pending' && c.initiated_by !== currentUserId
  )
  const activeChats = chats.filter((c) => c.status === 'accepted')
  const sentRequests = chats.filter(
    (c) => c.status === 'pending' && c.initiated_by === currentUserId
  )

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-0 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-6 rounded-r-lg shadow-lg hover:bg-blue-600 z-50 flex items-center gap-2"
      >
        <span className="text-sm font-medium">Chats</span>
        {totalUnread > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg z-40 flex flex-col border-r border-gray-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Private Chats</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 text-xl">
              ×
            </button>
          </div>

          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <div className="p-4 bg-yellow-50 border-b border-yellow-200">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">Pending Requests</h4>
              {pendingRequests.map((chat) => {
                const otherUser = chat.user1_id === currentUserId ? chat.user2 : chat.user1
                return (
                  <div key={chat.id} className="bg-white p-2 rounded mb-2 text-sm">
                    <p className="font-medium text-gray-900">{otherUser.nickname}</p>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleAcceptChat(chat.id)}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineChat(chat.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Active chats */}
          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Active Chats</h4>
            {activeChats.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4">
                No active chats yet. Click on another user&apos;s avatar to start chatting!
              </div>
            ) : (
              activeChats.map((chat) => {
                const otherUser = chat.user1_id === currentUserId ? chat.user2 : chat.user1
                const unreadCount = unreadCounts[chat.id] || 0

                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className="w-full p-3 bg-gray-50 rounded-lg mb-2 hover:bg-gray-100 text-left flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">{otherUser.nickname}</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                )
              })
            )}

            {sentRequests.length > 0 && (
              <>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Sent Requests</h4>
                {sentRequests.map((chat) => {
                  const otherUser = chat.user1_id === currentUserId ? chat.user2 : chat.user1
                  return (
                    <div key={chat.id} className="p-3 bg-gray-50 rounded-lg mb-2 text-sm">
                      <span className="font-medium text-gray-900">{otherUser.nickname}</span>
                      <span className="text-gray-500 ml-2">(Pending)</span>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* Chat window */}
      {selectedChatId && (
        <PrivateChatWindow
          chatId={selectedChatId}
          currentUserId={currentUserId}
          onClose={() => setSelectedChatId(null)}
        />
      )}
    </>
  )
}
