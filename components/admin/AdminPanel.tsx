'use client'

import { useState } from 'react'
import { UsersTab } from './UsersTab'
import { ContentTab } from './ContentTab'
import { ChatTab } from './ChatTab'
import { SystemTab } from './SystemTab'

interface AdminPanelProps {
  currentUserId: string
}

export function AdminPanel({ currentUserId }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'chat' | 'system'>('users')

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 z-50 text-sm font-medium"
      >
        Admin Panel
      </button>
    )
  }

  return (
    <div className="fixed top-4 right-4 w-[600px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-red-50">
        <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 text-2xl font-bold">
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'users' ?
            'bg-red-500 text-white' :
            'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'content' ?
            'bg-red-500 text-white' :
            'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'chat' ?
            'bg-red-500 text-white' :
            'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'system' ?
            'bg-red-500 text-white' :
            'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          System
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'users' && <UsersTab currentUserId={currentUserId} />}
        {activeTab === 'content' && <ContentTab currentUserId={currentUserId} />}
        {activeTab === 'chat' && <ChatTab currentUserId={currentUserId} />}
        {activeTab === 'system' && <SystemTab currentUserId={currentUserId} />}
      </div>
    </div>
  )
}
