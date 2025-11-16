# Ephemeral Canvas - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Next.js 14 (App Router)                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │   Canvas   │  │    Chat    │  │   Admin    │         │   │
│  │  │ Components │  │ Components │  │   Panel    │         │   │
│  │  └────────────┘  └────────────┘  └────────────┘         │   │
│  │                                                           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │      Real-time State Management                    │  │   │
│  │  │  (React Query + Supabase Realtime Subscriptions)   │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Supabase    │  │  Supabase    │  │  Supabase    │          │
│  │    Auth      │  │  Realtime    │  │  Database    │          │
│  │  (Google     │  │ (Broadcast + │  │  (Postgres)  │          │
│  │   OAuth)     │  │ Presence)    │  │   + RLS      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Supabase Edge Functions                        │   │
│  │  ┌────────────────┐  ┌────────────────────────────────┐  │   │
│  │  │ Daily Reset    │  │  Scheduled via pg_cron         │  │   │
│  │  │ Function       │  │  (00:00 UTC daily trigger)     │  │   │
│  │  └────────────────┘  └────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Netlify Hosting                       │   │
│  │  - Static site hosting (Next.js SSG/SSR)                 │   │
│  │  - Serverless functions (API routes)                     │   │
│  │  - Edge caching (CDN distribution)                       │   │
│  │  - Auto-deploy from Git                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

### 1. Authentication Flow
```
User → Google OAuth → Supabase Auth → JWT Token → Next.js Middleware
                                          ↓
                              Check profiles table
                                          ↓
                          Profile exists? ─┬─ Yes → Redirect to /canvas
                                          └─ No  → Show nickname modal
                                                      ↓
                                          Create profile → Redirect to /canvas
```

### 2. Real-time Position Updates Flow
```
User drags avatar
       ↓
Throttle (100ms)
       ↓
Supabase Broadcast (ephemeral, no DB write)
       ↓                                    ↓
All connected clients         Debounced DB write (1s after movement stops)
receive position update              ↓
       ↓                        Update profiles.position_x/y
Render avatar at new                 ↓
position on canvas            Update profiles.last_active_at
```

### 3. Thought Bubble Interaction Flow
```
User types thought → Post button
       ↓
Rate limit check (1 per 30s)
       ↓
Insert into thoughts table
       ↓
Supabase Realtime INSERT event
       ↓                              ↓
Render thought bubble       Update user's last_active_at
at user's current position         ↓
       ↓                    Check thought count (max 10)
User clicks bubble                  ↓
       ↓                    If >10: Delete oldest thought
Open modal with comments
```

### 4. Private Chat Flow
```
User A clicks User B's avatar
       ↓
Create private_chats entry (status: 'pending')
       ↓
Supabase Realtime INSERT → User B sees notification badge
       ↓
User B clicks "Accept"
       ↓
Update private_chats.status = 'accepted'
       ↓
Supabase Realtime UPDATE → Both users see green line
       ↓
Real-time position tracking → Line follows avatars
```

### 5. 24-Hour Reset Flow
```
pg_cron triggers at 00:00 UTC
       ↓
Call reset_world() SQL function
       ↓
┌─────────────────────────────────┐
│ TRUNCATE all user data tables   │
│ - profiles                      │
│ - thoughts                      │
│ - comments                      │
│ - comment_likes                 │
│ - open_chat                     │
│ - private_chats                 │
│ - private_messages              │
│ - spam_reports                  │
│ - admin_actions                 │
└─────────────────────────────────┘
       ↓
Update world_state (next_reset_at, reset_count)
       ↓
Broadcast reset event to all clients
       ↓
Force logout all users → Show maintenance page
```

---

## Component Architecture

### Canvas Layer (Konva.js)
```
<Stage> (root canvas container)
  └── <Layer name="background"> (grid, static elements)
  └── <Layer name="thoughts"> (thought bubbles, stationary)
      └── <ThoughtBubble /> (SVG-based bubble components)
  └── <Layer name="chat-lines"> (green connector lines)
      └── <Line /> (dynamic, position-based)
  └── <Layer name="avatars"> (user stick figures)
      └── <StickFigure draggable={isCurrentUser} />
  └── <Layer name="ui-overlay"> (minimap, controls)
```

### State Management Strategy
```typescript
// Real-time subscriptions (Supabase Realtime)
useRealtimeSubscription('profiles', {
  event: '*',
  filter: 'last_active_at>now()-5min'
})

// Cached queries (React Query)
useQuery(['thoughts', viewport], () =>
  supabase
    .from('thoughts')
    .select('*')
    .gte('position_x', viewport.minX)
    .lte('position_x', viewport.maxX)
    .gte('position_y', viewport.minY)
    .lte('position_y', viewport.maxY)
)

// Optimistic updates (React Query mutations)
useMutation({
  mutationFn: (thought) => supabase.from('thoughts').insert(thought),
  onMutate: (newThought) => {
    // Optimistically add to UI before DB confirmation
    queryClient.setQueryData(['thoughts'], (old) => [...old, newThought])
  }
})
```

---

## Performance Optimization Strategies

### 1. Viewport-Based Rendering
```typescript
// Only render entities within visible viewport + 20% buffer
const visibleAvatars = allAvatars.filter(avatar =>
  avatar.position_x >= viewport.minX - viewportBuffer &&
  avatar.position_x <= viewport.maxX + viewportBuffer &&
  avatar.position_y >= viewport.minY - viewportBuffer &&
  avatar.position_y <= viewport.maxY + viewportBuffer
)
```

### 2. Position Update Throttling
```typescript
// Throttle position broadcasts to 10 updates/second
const throttledBroadcast = useThrottle((position) => {
  supabaseClient.channel('canvas').send({
    type: 'broadcast',
    event: 'position',
    payload: { userId, ...position }
  })
}, 100) // 100ms = 10 updates/sec
```

### 3. Database Write Debouncing
```typescript
// Only persist position after movement stops (1s debounce)
const debouncedDBUpdate = useDebounce((position) => {
  supabase.from('profiles').update(position).eq('id', userId)
}, 1000)
```

### 4. Canvas Layer Optimization
- **Static layers**: Background grid (render once, never update)
- **Semi-static layers**: Thought bubbles (update only on new posts)
- **Dynamic layers**: Avatars (update every frame during movement)
- **Render prioritization**: Avatars > Chat lines > Thoughts > Background

### 5. Chat Line Rendering Limits
```typescript
// Only render closest 50 chat lines
const visibleChatLines = allChatLines
  .filter(line => {
    const distance = calculateDistance(line.user1, line.user2)
    return distance < 2000 // Max distance threshold
  })
  .sort((a, b) => a.distance - b.distance)
  .slice(0, 50) // Max 50 lines
```

---

## Security Architecture

### Row Level Security (RLS) Policies

#### Profiles Table
```sql
-- Users can view all profiles (for avatar rendering)
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can delete any profile
CREATE POLICY "Admins delete profiles" ON profiles FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));
```

#### Thoughts Table
```sql
-- Only show non-hidden thoughts to regular users
CREATE POLICY "View visible thoughts" ON thoughts FOR SELECT
  USING (is_hidden = FALSE);

-- Admins can view all thoughts
CREATE POLICY "Admins view all" ON thoughts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

-- Users can only delete their own thoughts
CREATE POLICY "Delete own thoughts" ON thoughts FOR DELETE
  USING (auth.uid() = user_id);
```

#### Private Messages
```sql
-- Users can only view messages in chats they're part of
CREATE POLICY "View own chats" ON private_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM private_chats
    WHERE id = chat_id
    AND (user_1_id = auth.uid() OR user_2_id = auth.uid())
  ));
```

### Authentication Security
- **JWT tokens**: Supabase Auth with automatic token refresh
- **Session persistence**: Secure HTTP-only cookies
- **CSRF protection**: Built-in Next.js middleware
- **Rate limiting**: Supabase built-in rate limits + custom throttling

### Data Validation
- **Client-side**: Zod schemas for type safety
- **Server-side**: Database constraints (check, unique, foreign keys)
- **RLS enforcement**: All queries respect user permissions

---

## Scalability Considerations

### Database Scaling
```sql
-- Partitioning strategy (if user base grows >10K concurrent)
CREATE TABLE thoughts_partitioned (
  LIKE thoughts INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create daily partitions
CREATE TABLE thoughts_2024_01_01 PARTITION OF thoughts_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-01-02');
```

### Real-time Connection Pooling
```typescript
// Limit Realtime subscriptions to viewport-based entities
const channel = supabase
  .channel('canvas_viewport')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'profiles',
    filter: `position_x=gte.${viewport.minX}&position_x=lte.${viewport.maxX}`
  })
  .subscribe()
```

### Caching Strategy
- **Supabase query caching**: 60-second cache for static data
- **React Query caching**: Stale-while-revalidate for thought bubbles
- **CDN caching**: Netlify edge caching for static assets
- **Local storage**: Cache user preferences, UI state

### Monitoring & Observability
- **Error tracking**: Sentry integration
- **Performance monitoring**: Vercel Analytics or Plausible
- **Database metrics**: Supabase dashboard (query performance, index usage)
- **Real-time metrics**: Active connections, message throughput

---

## Technology Stack Summary

### Frontend
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Canvas**: Konva.js (react-konva)
- **State Management**: React Query + Zustand (for UI state)
- **Real-time**: Supabase Realtime client

### Backend
- **BaaS**: Supabase (Auth, Database, Realtime, Edge Functions)
- **Database**: PostgreSQL with RLS
- **Auth**: Supabase Auth (Google OAuth)
- **Scheduled Jobs**: pg_cron extension

### Deployment
- **Hosting**: Netlify
- **CI/CD**: Netlify auto-deploy from Git
- **Environment**: Node.js 18+

### DevOps
- **Version Control**: Git + GitHub
- **Testing**: Playwright (E2E), Vitest (unit)
- **Linting**: ESLint + Prettier
- **Type Safety**: TypeScript strict mode

---

## API Endpoints

### Authentication
```
POST /auth/callback       # OAuth callback handler
GET  /api/auth/session    # Get current session
POST /api/auth/logout     # Logout and cleanup
```

### Canvas Data (via Supabase Client SDK)
```typescript
// Profiles (users/avatars)
supabase.from('profiles').select('*').gte('last_active_at', fiveMinutesAgo)

// Thoughts (within viewport)
supabase.from('thoughts').select('*').range('position_x', minX, maxX)

// Comments (for a thought)
supabase.from('comments').select('*, profiles(nickname)').eq('thought_id', id)

// Open Chat (last 100 messages)
supabase.from('open_chat').select('*').order('created_at', { ascending: false }).limit(100)

// Private Chats (for current user)
supabase.from('private_chats').select('*').or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
```

### Admin Actions
```typescript
// Delete user (admin only)
supabase.from('profiles').delete().eq('id', targetUserId)

// Manual reset (admin only)
supabase.rpc('reset_world')

// View admin actions log
supabase.from('admin_actions').select('*').order('created_at', { ascending: false })
```

---

## Environment Variables

### Development (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Admin
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com

# Optional
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX
```

### Production (Netlify Environment Variables)
- Same as development, but with production Supabase credentials
- Ensure `NEXT_PUBLIC_*` variables are set in Netlify UI

---

## Conclusion

This architecture prioritizes:
1. **Real-time performance**: Optimized broadcasts, viewport-based rendering
2. **Scalability**: Efficient database queries, connection pooling
3. **Security**: RLS policies, auth validation, rate limiting
4. **Maintainability**: Clear separation of concerns, TypeScript type safety

The ephemeral 24-hour lifecycle simplifies many traditional web app concerns (data archival, GDPR compliance, infinite scaling), allowing focus on real-time UX excellence.
