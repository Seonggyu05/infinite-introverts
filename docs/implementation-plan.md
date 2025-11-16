# Ephemeral Canvas - Implementation Plan

## Overview
This document outlines the phased implementation approach for the Ephemeral Canvas application, prioritizing core functionality first with progressive feature additions.

---

## Phase 1: Foundation Setup (Week 1, Days 1-2)

### Objectives
- Initialize project infrastructure
- Configure Supabase backend
- Set up Next.js frontend with TypeScript

### Tasks

#### 1.1 Supabase Project Setup
- [ ] Create new Supabase project
- [ ] Configure Google OAuth provider in Supabase Auth
- [ ] Execute database schema SQL (from `database-schema.sql`)
- [ ] Configure RLS policies
- [ ] Set up Supabase Realtime for required tables
- [ ] Create admin user (manually set `is_admin = true`)

#### 1.2 Next.js Project Initialization
```bash
npx create-next-app@latest ephemeral-canvas --typescript --tailwind --app
cd ephemeral-canvas
npm install @supabase/supabase-js @supabase/ssr @supabase/auth-helpers-nextjs
npm install react-konva konva
npm install @tanstack/react-query
npm install react-zoom-pan-pinch
npm install date-fns
```

#### 1.3 Environment Configuration
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
```

#### 1.4 Supabase Client Setup
- [ ] Create `lib/supabase/client.ts` (client-side)
- [ ] Create `lib/supabase/server.ts` (server-side)
- [ ] Set up auth helpers and middleware

#### 1.5 Project Structure
```
/app
  /auth
    /callback/route.ts
  /canvas/page.tsx
  layout.tsx
  page.tsx
/components
  /canvas
  /chat
  /ui
/lib
  /supabase
  /hooks
  /utils
/types
  database.types.ts
```

### Deliverables
- ✅ Supabase project configured with schema
- ✅ Next.js app initialized with TypeScript
- ✅ Authentication flow scaffold
- ✅ Development environment ready

---

## Phase 2: Core Canvas & Authentication (Week 1, Days 3-4)

### Objectives
- Implement Google OAuth login flow
- Create nickname registration system
- Build infinite canvas with pan/zoom

### Tasks

#### 2.1 Authentication System
- [ ] Google OAuth login button component
- [ ] Auth callback handler (`/auth/callback/route.ts`)
- [ ] Session persistence with middleware
- [ ] Logout functionality with confirmation modal
- [ ] Protected route wrapper for canvas

#### 2.2 Nickname Registration
- [ ] First-time user detection (no profile in DB)
- [ ] Nickname input modal with validation:
  - Max 50 characters
  - Uniqueness check via Supabase RPC
  - Real-time availability feedback
- [ ] Profile creation on submit with random spawn position
- [ ] Auto-redirect to canvas after registration

#### 2.3 Infinite Canvas Foundation
- [ ] Canvas component with Konva.js (`components/canvas/InfiniteCanvas.tsx`)
- [ ] Pan functionality (drag background)
- [ ] Zoom functionality (mouse wheel + pinch gestures)
- [ ] Coordinate system (-50000 to 50000 bounds)
- [ ] Grid background (optional, for visual reference)
- [ ] Home button (return to 0,0)

#### 2.4 Viewport Management
- [ ] Viewport state management (center X/Y, zoom level)
- [ ] Viewport-based rendering logic (only render within view + buffer)
- [ ] Performance optimization: debounced render updates

### Deliverables
- ✅ Users can log in via Google OAuth
- ✅ Nickname registration enforces uniqueness
- ✅ Infinite canvas with pan/zoom working
- ✅ Session persistence across refreshes

---

## Phase 3: Real-time Features (Week 1, Days 5-7)

### Objectives
- Display user avatars (stick figures)
- Implement real-time avatar movement
- Show online/offline presence

### Tasks

#### 3.1 Avatar Rendering
- [ ] Stick figure SVG component (`components/canvas/StickFigure.tsx`)
- [ ] Nickname label below avatar
- [ ] Avatar positioning on canvas based on DB coordinates
- [ ] Highlight current user's avatar (different color)

#### 3.2 Avatar Movement
- [ ] Draggable avatar for current user
- [ ] Position update on drag end
- [ ] Broadcast position via Supabase Broadcast (not DB writes)
- [ ] Throttle position updates to 100ms intervals
- [ ] Persist position to DB on:
  - Movement stop (debounced 1 second)
  - Every 5 seconds during continuous movement
  - User disconnect

#### 3.3 Real-time Presence System
- [ ] Supabase Realtime subscription to `profiles` table changes
- [ ] Supabase Presence for online/offline status
- [ ] Display only online users' avatars
- [ ] Handle user join/leave events
- [ ] Update `last_active_at` timestamp on activity

#### 3.4 Performance Optimization
- [ ] Viewport-based avatar rendering (only show avatars in view)
- [ ] Avatar pooling/recycling for performance
- [ ] Optimize re-renders with React.memo
- [ ] Use canvas layers (background, avatars, UI)

### Deliverables
- ✅ Stick figure avatars render for all online users
- ✅ Real-time position updates with minimal lag
- ✅ Current user can drag their avatar
- ✅ Users appear/disappear on join/leave

---

## Phase 4: Thought Bubbles & Comments (Week 2, Days 8-10)

### Objectives
- Implement thought bubble posting system
- Display thought bubbles on canvas
- Build nested commenting system (L1/L2)

### Tasks

#### 4.1 Thought Bubble Input
- [ ] "What's on your mind?" text area (top-right corner)
- [ ] Character counter (max 300 words ≈ 1800 chars)
- [ ] Post button + Enter key handler
- [ ] Rate limiting (1 thought per 30 seconds)
- [ ] Clear input after posting

#### 4.2 Thought Bubble Display
- [ ] Thought bubble SVG component (`components/canvas/ThoughtBubble.tsx`)
- [ ] Position thought at user's current location on post
- [ ] Thought bubbles are stationary (don't move with user)
- [ ] Comment count badge on bubble
- [ ] Click to open thought detail modal

#### 4.3 Thought Detail Modal
- [ ] Modal with thought content display
- [ ] Author nickname and timestamp
- [ ] Comment list (hierarchical L1/L2)
- [ ] Comment input box
- [ ] Delete button (only for own thoughts)

#### 4.4 Commenting System
- [ ] L1 comment input (direct replies to thought)
- [ ] L2 comment input (replies to L1 comments)
- [ ] Prevent L3 comments (enforce in UI and DB constraint)
- [ ] Like button for comments (toggle on/off)
- [ ] Like count display
- [ ] Delete own comments functionality
- [ ] Real-time comment updates via Supabase Realtime

#### 4.5 Spam Prevention
- [ ] Implement 10-thought limit per user (auto-delete oldest)
- [ ] Spam report button (3 reports = auto-hide)
- [ ] Admin review queue for hidden thoughts

### Deliverables
- ✅ Users can post thought bubbles at their location
- ✅ Thought bubbles stay at posting location
- ✅ Nested comments work (L1, L2 only)
- ✅ Real-time comment/like updates

---

## Phase 5: Chat Systems (Week 2, Days 11-13)

### Objectives
- Build global "Open Chat" system
- Implement private chat system with request/accept flow
- Display visual connectors for private chats

### Tasks

#### 5.1 Open Chat (Global)
- [ ] Chat panel component (bottom-left corner)
- [ ] Message list with auto-scroll
- [ ] Message input box
- [ ] Real-time message subscription (Supabase Realtime)
- [ ] Display nickname + timestamp for each message
- [ ] Resizable chat box (drag corner to resize)
- [ ] No delete option for regular users
- [ ] Admin delete button (if user is admin)

#### 5.2 Private Chat Initiation
- [ ] Click on another user's avatar to open chat request modal
- [ ] Send chat request (create `private_chats` entry with status 'pending')
- [ ] Notification badge on "Chats" toggle (left edge)
- [ ] Accept/Decline buttons for recipient

#### 5.3 Private Chat Interface
- [ ] "Chats" toggle button (left edge)
- [ ] Chat list panel showing active conversations
- [ ] Unread message count per conversation
- [ ] Chat window modal (click conversation to open)
- [ ] Real-time message updates
- [ ] Message read status updates

#### 5.4 Visual Chat Connector
- [ ] Draw green line between avatars when chat is accepted
- [ ] Line updates in real-time as users move
- [ ] Fade opacity based on distance (100% at 0px, 0% at 2000px)
- [ ] Only render lines within viewport or <2000px distance
- [ ] Limit to 50 concurrent visible lines (prioritize closest)

#### 5.5 Chat Performance
- [ ] Throttle line rendering updates
- [ ] Use CSS transforms for line positioning
- [ ] Implement line pooling for performance
- [ ] Debounce message sending (prevent spam)

### Deliverables
- ✅ Global chat working with real-time updates
- ✅ Private chat request/accept flow functional
- ✅ Green lines connect chatting users
- ✅ Chat notifications work correctly

---

## Phase 6: Admin Panel & Moderation (Week 3, Days 14-15)

### Objectives
- Build embedded admin control panel
- Implement content moderation tools
- Create audit trail system

### Tasks

#### 6.1 Admin Panel UI
- [ ] Admin panel toggle button (top-right, visible only to admins)
- [ ] Floating overlay panel with tabs:
  - **Users**: List all profiles with delete buttons
  - **Content**: Filter/search thoughts and comments
  - **Chat**: View Open Chat messages
  - **System**: Manual reset button
- [ ] Admin check on component mount (query `profiles.is_admin`)

#### 6.2 Admin Actions
- [ ] Delete user → removes from `profiles` (cascade deletes content)
- [ ] Delete thought → sets `is_hidden = true` or hard deletes
- [ ] Delete comment → hard delete from `comments`
- [ ] Delete Open Chat message → hard delete from `open_chat`
- [ ] All actions log to `admin_actions` table

#### 6.3 Manual World Reset
- [ ] "Manual Reset" button with password confirmation
- [ ] Call `reset_world()` SQL function via RPC
- [ ] Broadcast reset event to all connected clients
- [ ] Force logout all users
- [ ] Show maintenance screen during reset

#### 6.4 Spam Report Review
- [ ] Admin view of spam reports
- [ ] Quick action: unhide thought (if false positive)
- [ ] Quick action: confirm hide + ban user (if legitimate spam)

### Deliverables
- ✅ Admins have access to moderation panel
- ✅ All admin actions are logged
- ✅ Manual reset functionality works
- ✅ Spam reports can be reviewed

---

## Phase 7: 24-Hour Reset System (Week 3, Days 16-17)

### Objectives
- Implement automated daily reset
- Build countdown timer
- Create warning notification system

### Tasks

#### 7.1 Countdown Timer
- [ ] Fetch `next_reset_at` from `world_state` table
- [ ] Display countdown in top-left corner (HH:MM:SS format)
- [ ] Update every second
- [ ] Sync across all clients (use server time, not client time)

#### 7.2 Warning System
- [ ] 10-minute warning: Toast notification
- [ ] 5-minute warning: Modal overlay (dismissible)
- [ ] 1-minute warning: Full-screen countdown (non-dismissible)
- [ ] 0 seconds: Force logout + redirect to maintenance page

#### 7.3 Automated Reset (Supabase Edge Function)
- [ ] Create Edge Function for daily reset:
  ```typescript
  // functions/daily-reset/index.ts
  import { createClient } from '@supabase/supabase-js'

  Deno.serve(async (req) => {
    const supabase = createClient(...)
    await supabase.rpc('reset_world')
    return new Response('Reset complete', { status: 200 })
  })
  ```
- [ ] Schedule via `pg_cron` or external cron service (e.g., cron-job.org)
- [ ] Cron expression: `0 0 * * *` (daily at 00:00 UTC)

#### 7.4 Reset Recovery
- [ ] Maintenance page during reset (30-second window)
- [ ] Auto-refresh clients after reset completes
- [ ] Fresh world state loaded on reconnect

### Deliverables
- ✅ Countdown timer displays time to reset
- ✅ Warning notifications appear at correct intervals
- ✅ Automated reset runs daily at 00:00 UTC
- ✅ Users are gracefully disconnected and can rejoin

---

## Phase 8: Mobile Optimization & Polish (Week 3-4, Days 18-21)

### Objectives
- Optimize UI for mobile devices
- Implement touch gestures
- Add progressive UI disclosure
- Performance tuning

### Tasks

#### 8.1 Responsive UI Layout
- [ ] Mobile-first CSS with Tailwind breakpoints
- [ ] Collapsible UI elements (hidden by default on mobile):
  - Thought input (floating "+" button to reveal)
  - Open Chat (slide-in from bottom)
  - Minimap (tap to expand)
- [ ] Fixed UI elements:
  - Countdown timer (top-left, compact)
  - Zoom controls (bottom-right, floating)
  - Chats toggle (left edge, compact)

#### 8.2 Touch Gesture Implementation
- [ ] One-finger drag on avatar → Move avatar
- [ ] One-finger drag on background → Pan canvas
- [ ] Pinch gesture → Zoom in/out
- [ ] Double-tap → Center on (0,0)
- [ ] Long-press on avatar → Open private chat request

#### 8.3 Minimap
- [ ] Small minimap in bottom-right corner
- [ ] Show all users as colored dots
- [ ] Show current viewport as rectangle
- [ ] Click minimap to jump to location
- [ ] Resizable (drag corner)
- [ ] Toggle visibility on mobile (tap to expand/collapse)

#### 8.4 Performance Tuning
- [ ] Lazy load components
- [ ] Optimize Konva canvas rendering
- [ ] Implement virtual scrolling for chat messages
- [ ] Reduce bundle size (code splitting)
- [ ] Lighthouse performance audit (target >90 score)

#### 8.5 Accessibility
- [ ] Keyboard navigation support
- [ ] ARIA labels for all interactive elements
- [ ] Screen reader support
- [ ] High contrast mode support
- [ ] Focus indicators

#### 8.6 Error Handling & Edge Cases
- [ ] Network disconnection handling
- [ ] Session expiration recovery
- [ ] Empty state messaging (no users online, no thoughts nearby)
- [ ] Rate limit UI feedback
- [ ] Form validation error messages

#### 8.7 Final Polish
- [ ] Smooth animations (avatar movement, thought posting)
- [ ] Loading states for all async operations
- [ ] Skeleton screens during initial load
- [ ] Easter eggs (optional: fun interactions on canvas)
- [ ] Onboarding tutorial for first-time users

### Deliverables
- ✅ Mobile experience is fully functional and polished
- ✅ Touch gestures work intuitively
- ✅ Performance meets targets (>90 Lighthouse score)
- ✅ Accessibility standards met (WCAG 2.1 AA)

---

## Deployment Strategy

### Pre-Deployment Checklist
- [ ] All environment variables set in Netlify
- [ ] Supabase production database migrated
- [ ] RLS policies tested in production
- [ ] Scheduled reset function deployed and tested
- [ ] Admin account created in production
- [ ] Error tracking enabled (e.g., Sentry)
- [ ] Analytics configured (optional: Vercel Analytics, Plausible)

### Netlify Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Initialize Netlify project
netlify init

# Deploy
netlify deploy --prod
```

### Post-Deployment
- [ ] Smoke test all critical flows
- [ ] Monitor Supabase real-time connections
- [ ] Set up uptime monitoring
- [ ] Load testing with 50-100 concurrent users
- [ ] Monitor database performance and indexes
- [ ] Set up backup strategy (Supabase automatic backups)

---

## Testing Strategy

### Unit Tests
- Canvas utility functions (coordinate transformations)
- Validation functions (nickname uniqueness, comment depth)
- Date/time utilities (countdown timer)

### Integration Tests
- Authentication flow (login → nickname → canvas)
- Thought posting and commenting
- Private chat request/accept flow
- Admin moderation actions

### E2E Tests (Playwright)
- Full user journey: login → move → post thought → chat
- Multi-user scenarios (2+ browser instances)
- Mobile viewport testing
- Reset flow testing

### Performance Tests
- 100 concurrent users simulation
- Position update broadcast load
- Database query performance
- Real-time message throughput

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|-----------|
| Supabase Realtime connection limits | Implement connection pooling, viewport-based subscriptions |
| Database performance at scale | Proper indexing, materialized views, query optimization |
| Canvas rendering performance | Viewport-based rendering, React.memo, canvas layers |
| Real-time position update flooding | Throttle to 100ms, use Broadcast (not DB writes) |
| Mobile touch gesture conflicts | Clear gesture separation, visual feedback |
| 24-hour reset during active use | Multi-stage warning system, graceful disconnection |

### Product Risks

| Risk | Mitigation |
|------|-----------|
| Low user retention (ephemeral nature) | Clear onboarding about 24h concept, engaging features |
| Spam/abuse | Rate limiting, spam reports, admin moderation tools |
| Empty canvas (no users online) | Seed with "bot" thoughts (optional), clear messaging |
| Confusing UX for new users | Onboarding tutorial, tooltips, help documentation |

---

## Success Metrics

### Technical KPIs
- **Page Load Time**: <2 seconds
- **Real-time Latency**: <200ms for position updates
- **Uptime**: >99.5%
- **Lighthouse Performance**: >90
- **Concurrent Users Supported**: 100+ without degradation

### Product KPIs
- **Daily Active Users (DAU)**: Track growth
- **Average Session Duration**: Target >10 minutes
- **Thoughts Posted per Day**: Engagement indicator
- **Private Chats Initiated**: Social connection metric
- **User Retention**: % returning after reset

---

## Future Enhancements (Post-MVP)

### Phase 9: Advanced Features (Optional)
- **Thought Bubbles with Media**: Support images, GIFs, links
- **User Profiles**: Avatar customization, bio, stats
- **Friend System**: Follow users across resets, private spawn zones
- **Canvas Themes**: Dark mode, seasonal themes
- **Voice Chat**: WebRTC-based spatial audio
- **Achievement System**: Badges for participation, exploration
- **Analytics Dashboard**: For admins (user heatmaps, engagement metrics)
- **Mobile Apps**: React Native versions for iOS/Android
- **Canvas Export**: Download canvas snapshot before reset

### Phase 10: Monetization (If Applicable)
- **Premium Features**: Custom avatars, private canvases, longer thoughts
- **Sponsorships**: Branded thought bubbles (ethical implementation)
- **Donations**: Support server costs via Patreon, Ko-fi

---

## Conclusion

This implementation plan provides a structured, phased approach to building Ephemeral Canvas. Each phase builds upon the previous, ensuring a stable foundation before adding complexity. The 21-day timeline is aggressive but achievable with focused development.

**Recommended Team Structure** (if not solo):
- 1 Full-Stack Developer (Phases 1-8)
- 1 UI/UX Designer (Phases 2, 4, 5, 8)
- 1 QA Tester (Phases 6-8)

**Solo Development Timeline**: 3-4 weeks for MVP (Phases 1-7), +1 week for Phase 8 polish.

Ready to start implementation? Let's begin with **Phase 1: Foundation Setup**! 🚀
