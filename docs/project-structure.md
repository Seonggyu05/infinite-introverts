# Ephemeral Canvas - Project Structure

## Directory Tree

```
ephemeral-canvas/
├── .env.local                    # Environment variables (not committed)
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── README.md
│
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing/login page
│   ├── globals.css               # Global styles + Tailwind
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # OAuth callback handler
│   │
│   ├── canvas/
│   │   ├── page.tsx              # Main canvas page (protected)
│   │   └── layout.tsx            # Canvas-specific layout
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── session/
│   │   │       └── route.ts      # Session API endpoint
│   │   └── admin/
│   │       ├── reset/
│   │       │   └── route.ts      # Manual reset endpoint
│   │       └── actions/
│   │           └── route.ts      # Admin action logger
│   │
│   └── maintenance/
│       └── page.tsx              # Maintenance page (during reset)
│
├── components/                   # React components
│   ├── canvas/
│   │   ├── InfiniteCanvas.tsx    # Main Konva canvas wrapper
│   │   ├── StickFigure.tsx       # User avatar component
│   │   ├── ThoughtBubble.tsx     # Thought bubble component
│   │   ├── ChatLine.tsx          # Private chat connector line
│   │   ├── Minimap.tsx           # Canvas minimap
│   │   ├── ViewportManager.tsx   # Viewport state and utilities
│   │   └── CanvasControls.tsx    # Zoom, home, etc.
│   │
│   ├── chat/
│   │   ├── OpenChat.tsx          # Global chat panel
│   │   ├── PrivateChatModal.tsx  # Private chat window
│   │   ├── ChatList.tsx          # List of active private chats
│   │   ├── ChatNotificationBadge.tsx
│   │   └── MessageInput.tsx      # Reusable message input
│   │
│   ├── thoughts/
│   │   ├── ThoughtInput.tsx      # "What's on your mind?" input
│   │   ├── ThoughtDetailModal.tsx
│   │   ├── CommentList.tsx       # Nested comment display
│   │   ├── CommentInput.tsx
│   │   └── SpamReportButton.tsx
│   │
│   ├── auth/
│   │   ├── LoginButton.tsx       # Google OAuth button
│   │   ├── NicknameModal.tsx     # First-time nickname input
│   │   ├── LogoutButton.tsx      # Logout with confirmation
│   │   └── AuthProvider.tsx      # Auth context wrapper
│   │
│   ├── admin/
│   │   ├── AdminPanel.tsx        # Main admin overlay
│   │   ├── UserManagement.tsx    # User list + delete
│   │   ├── ContentModeration.tsx # Thought/comment moderation
│   │   ├── ChatModeration.tsx    # Open chat moderation
│   │   ├── ManualResetButton.tsx
│   │   └── AdminActionLog.tsx    # Audit trail viewer
│   │
│   ├── ui/
│   │   ├── CountdownTimer.tsx    # Global reset countdown
│   │   ├── WarningModal.tsx      # Reset warning overlays
│   │   ├── Button.tsx            # Reusable button component
│   │   ├── Modal.tsx             # Reusable modal wrapper
│   │   ├── Toast.tsx             # Toast notification system
│   │   └── Spinner.tsx           # Loading spinner
│   │
│   └── providers/
│       ├── ReactQueryProvider.tsx
│       ├── SupabaseProvider.tsx
│       └── ToastProvider.tsx
│
├── lib/                          # Utilities and configurations
│   ├── supabase/
│   │   ├── client.ts             # Client-side Supabase client
│   │   ├── server.ts             # Server-side Supabase client
│   │   ├── middleware.ts         # Auth middleware
│   │   └── realtime.ts           # Realtime subscription helpers
│   │
│   ├── hooks/
│   │   ├── useAuth.ts            # Auth state hook
│   │   ├── useRealtimeSubscription.ts
│   │   ├── useThrottle.ts        # Throttle hook
│   │   ├── useDebounce.ts        # Debounce hook
│   │   ├── useViewport.ts        # Canvas viewport state
│   │   ├── useAvatarMovement.ts  # Avatar drag logic
│   │   ├── useCountdown.ts       # Reset countdown logic
│   │   └── useAdmin.ts           # Admin permission check
│   │
│   ├── utils/
│   │   ├── coordinates.ts        # Canvas coordinate utilities
│   │   ├── validation.ts         # Input validation schemas (Zod)
│   │   ├── formatters.ts         # Date, time, text formatters
│   │   ├── canvas-helpers.ts     # Canvas rendering helpers
│   │   └── rate-limit.ts         # Client-side rate limiting
│   │
│   └── constants/
│       ├── canvas.ts             # Canvas bounds, spawn zones
│       ├── limits.ts             # Rate limits, max lengths
│       └── ui.ts                 # UI constants (colors, sizes)
│
├── types/                        # TypeScript types
│   ├── database.types.ts         # Auto-generated from Supabase
│   ├── canvas.types.ts           # Canvas-specific types
│   ├── chat.types.ts             # Chat types
│   └── admin.types.ts            # Admin types
│
├── supabase/                     # Supabase-specific files
│   ├── migrations/
│   │   └── 20240101_initial_schema.sql
│   ├── functions/
│   │   └── daily-reset/
│   │       ├── index.ts          # Edge Function for reset
│   │       └── deno.json
│   └── config.toml               # Supabase CLI config
│
├── public/                       # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│       └── stick-figure.svg      # Avatar SVG template
│
└── tests/                        # Test files
    ├── e2e/
    │   ├── auth.spec.ts          # Auth flow tests
    │   ├── canvas.spec.ts        # Canvas interaction tests
    │   ├── chat.spec.ts          # Chat system tests
    │   └── admin.spec.ts         # Admin functionality tests
    │
    ├── integration/
    │   ├── supabase.test.ts      # Supabase queries
    │   └── realtime.test.ts      # Realtime subscriptions
    │
    └── unit/
        ├── coordinates.test.ts   # Coordinate utilities
        ├── validation.test.ts    # Validation schemas
        └── formatters.test.ts    # Formatter functions
```

---

## Key File Descriptions

### Core Application Files

#### `app/layout.tsx` (Root Layout)
```typescript
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          <ReactQueryProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ReactQueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
```

#### `app/canvas/page.tsx` (Main Canvas Page)
```typescript
import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas'
import { ThoughtInput } from '@/components/thoughts/ThoughtInput'
import { OpenChat } from '@/components/chat/OpenChat'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { Minimap } from '@/components/canvas/Minimap'
import { CanvasControls } from '@/components/canvas/CanvasControls'
import { ChatNotificationBadge } from '@/components/chat/ChatNotificationBadge'

export default async function CanvasPage() {
  // Server-side auth check
  const user = await getUser() // from lib/supabase/server.ts

  if (!user) redirect('/') // Redirect to login

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Top-left: Countdown timer */}
      <div className="absolute top-4 left-4 z-50">
        <CountdownTimer />
      </div>

      {/* Top-right: Thought input */}
      <div className="absolute top-4 right-4 z-50">
        <ThoughtInput />
      </div>

      {/* Bottom-left: Open chat */}
      <div className="absolute bottom-4 left-4 z-40">
        <OpenChat />
      </div>

      {/* Bottom-right: Minimap */}
      <div className="absolute bottom-4 right-4 z-40">
        <Minimap />
      </div>

      {/* Right edge: Canvas controls (zoom) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40">
        <CanvasControls />
      </div>

      {/* Left edge: Private chat toggle */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-40">
        <ChatNotificationBadge />
      </div>

      {/* Admin panel (conditional) */}
      <AdminPanel />

      {/* Main canvas (full screen) */}
      <InfiniteCanvas />
    </div>
  )
}
```

#### `lib/supabase/client.ts` (Client-side Supabase)
```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

#### `lib/hooks/useRealtimeSubscription.ts`
```typescript
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimeSubscription(
  table: string,
  queryKey: string[],
  filter?: string
) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter
        },
        () => {
          // Invalidate React Query cache on any change
          queryClient.invalidateQueries({ queryKey })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, queryKey, filter])
}
```

---

## Configuration Files

### `package.json`
```json
{
  "name": "ephemeral-canvas",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit",
    "supabase:gen-types": "supabase gen types typescript --local > types/database.types.ts"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/ssr": "^0.0.10",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "@tanstack/react-query": "^5.0.0",
    "react-konva": "^18.2.0",
    "konva": "^9.2.0",
    "react-zoom-pan-pinch": "^3.3.0",
    "date-fns": "^3.0.0",
    "zod": "^3.22.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.1.0",
    "vitest": "^1.0.0",
    "@playwright/test": "^1.40.0",
    "supabase": "^1.142.0"
  }
}
```

### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com'], // Google OAuth profile images
  },
  // Optimize for Netlify deployment
  output: 'standalone',
}

module.exports = nextConfig
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#FFFFFF',
          grid: '#F0F0F0',
        },
        chat: {
          line: '#22C55E', // Green for chat connectors
        },
      },
    },
  },
  plugins: [],
}
export default config
```

---

## Component Naming Conventions

### File Naming
- **Components**: PascalCase (e.g., `StickFigure.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `coordinates.ts`)
- **Types**: camelCase with `.types.ts` suffix (e.g., `canvas.types.ts`)
- **Tests**: Same as file with `.test.ts` or `.spec.ts` suffix

### Component Structure
```typescript
// components/canvas/StickFigure.tsx
import { Group, Circle, Line } from 'react-konva'

interface StickFigureProps {
  userId: string
  nickname: string
  position: { x: number; y: number }
  isCurrentUser: boolean
  onDragEnd?: (position: { x: number; y: number }) => void
}

export function StickFigure({
  userId,
  nickname,
  position,
  isCurrentUser,
  onDragEnd
}: StickFigureProps) {
  return (
    <Group
      x={position.x}
      y={position.y}
      draggable={isCurrentUser}
      onDragEnd={(e) => {
        const node = e.target
        onDragEnd?.({ x: node.x(), y: node.y() })
      }}
    >
      {/* Stick figure SVG elements */}
      <Circle radius={10} fill={isCurrentUser ? '#3B82F6' : '#000000'} />
      {/* Body, arms, legs */}
      {/* Nickname label */}
    </Group>
  )
}
```

---

## State Management Strategy

### Global State (Zustand)
```typescript
// lib/store/ui-store.ts
import { create } from 'zustand'

interface UIState {
  isChatOpen: boolean
  isAdminPanelOpen: boolean
  unreadChatsCount: number
  setIsChatOpen: (open: boolean) => void
  setIsAdminPanelOpen: (open: boolean) => void
  setUnreadChatsCount: (count: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  isChatOpen: false,
  isAdminPanelOpen: false,
  unreadChatsCount: 0,
  setIsChatOpen: (open) => set({ isChatOpen: open }),
  setIsAdminPanelOpen: (open) => set({ isAdminPanelOpen: open }),
  setUnreadChatsCount: (count) => set({ unreadChatsCount: count }),
}))
```

### Server State (React Query)
```typescript
// lib/hooks/useThoughts.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useThoughts(viewport: Viewport) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['thoughts', viewport],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thoughts')
        .select('*, profiles(nickname)')
        .gte('position_x', viewport.minX)
        .lte('position_x', viewport.maxX)
        .gte('position_y', viewport.minY)
        .lte('position_y', viewport.maxY)
        .eq('is_hidden', false)

      if (error) throw error
      return data
    },
    staleTime: 30000, // 30 seconds
  })
}
```

---

## Testing Structure

### E2E Test Example
```typescript
// tests/e2e/canvas.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Canvas Interaction', () => {
  test('user can move their avatar', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.click('[data-testid="google-login"]')

    // Enter nickname
    await page.fill('[data-testid="nickname-input"]', 'TestUser')
    await page.click('[data-testid="nickname-submit"]')

    // Wait for canvas load
    await page.waitForSelector('[data-testid="infinite-canvas"]')

    // Drag avatar
    const avatar = page.locator('[data-testid="current-user-avatar"]')
    await avatar.dragTo(page.locator('[data-testid="canvas-center"]'))

    // Verify position updated
    const position = await avatar.evaluate(el => ({
      x: el.getAttribute('data-x'),
      y: el.getAttribute('data-y')
    }))

    expect(position.x).not.toBe('0')
    expect(position.y).not.toBe('0')
  })
})
```

---

## Conclusion

This project structure provides:
- **Clear separation of concerns**: Components, utilities, types separate
- **Scalability**: Easy to add features without restructuring
- **Type safety**: TypeScript everywhere with auto-generated Supabase types
- **Testability**: Organized test structure for all layers
- **Developer experience**: Intuitive file organization and naming

Ready to begin implementation with Phase 1? 🚀
