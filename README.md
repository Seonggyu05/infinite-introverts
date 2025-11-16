# Ephemeral Canvas 🎨

A real-time, multi-user social canvas where users interact via stick-figure avatars, post ephemeral thought bubbles, and engage in both public and private conversations. **Everything resets every 24 hours.**

## ✨ Features

- **Infinite Canvas**: Pan and zoom across a vast 2D space
- **Real-time Avatars**: See other users move in real-time as stick figures
- **Thought Bubbles**: Post public thoughts attached to locations on the canvas
- **Nested Comments**: L1 and L2 commenting system with likes
- **Global Chat**: Persistent "Open Chat" visible to everyone
- **Private Chats**: Visual green connectors between chatting users
- **24-Hour Reset**: Complete data wipe every day at 00:00 UTC
- **Admin Moderation**: Content moderation and manual reset capabilities
- **Mobile Optimized**: Full touch gesture support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier)
- Google Cloud Console account (for OAuth)

### 1. Clone and Install

```bash
cd "/Users/jeonseonggyu/Documents/Infinite Introverts"
npm install
```

### 2. Set Up Supabase

1. Create new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Execute `docs/database-schema.sql` in SQL Editor
3. Configure Google OAuth in Authentication > Providers
4. Copy your project URL and anon key

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_ADMIN_EMAIL=your-admin-email@gmail.com
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- [Setup Guide](SETUP.md) - Detailed setup instructions
- [Implementation Plan](docs/implementation-plan.md) - 8-phase development roadmap
- [Architecture](docs/architecture.md) - System design and data flows
- [Project Structure](docs/project-structure.md) - File organization
- [Database Schema](docs/database-schema.sql) - Complete SQL schema

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Canvas**: Konva.js (react-konva)
- **Backend**: Supabase (Auth, Database, Realtime)
- **Database**: PostgreSQL with Row Level Security
- **Deployment**: Netlify
- **State**: React Query + Zustand

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── canvas/            # Canvas-related components
│   ├── chat/              # Chat system components
│   ├── thoughts/          # Thought bubble components
│   ├── auth/              # Authentication components
│   └── admin/             # Admin panel components
├── lib/                    # Utilities and hooks
│   ├── supabase/          # Supabase clients
│   ├── hooks/             # Custom React hooks
│   ├── constants/         # App constants
│   └── utils/             # Utility functions
├── types/                  # TypeScript types
├── docs/                   # Documentation
└── public/                 # Static assets
```

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Google OAuth for authentication
- Rate limiting on thought posting
- Spam reporting and auto-hide system
- Admin audit trail for all moderation actions

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# E2E tests (Playwright)
npm run test:e2e
```

## 🚢 Deployment

### Netlify

1. Push to GitHub
2. Connect repo to Netlify
3. Add environment variables in Netlify dashboard
4. Deploy!

Build settings:
- Build command: `npm run build`
- Publish directory: `.next`

## 📊 Performance Targets

- Page load: <2 seconds
- Real-time latency: <200ms
- Concurrent users: 100+ (MVP)
- Lighthouse score: >90

## 🗺️ Development Roadmap

- [x] Phase 1: Foundation Setup
- [ ] Phase 2: Core Canvas & Authentication
- [ ] Phase 3: Real-time Features
- [ ] Phase 4: Thought Bubbles & Comments
- [ ] Phase 5: Chat Systems
- [ ] Phase 6: Admin Panel
- [ ] Phase 7: 24-Hour Reset System
- [ ] Phase 8: Mobile Optimization

## 🤝 Contributing

This is a solo project, but feedback and suggestions are welcome!

## 📝 License

MIT License - See LICENSE file for details

## 🎯 Current Status

**Phase 1: Foundation Setup** - Initial project scaffolding and configuration complete.

Next steps:
1. Complete Supabase project setup ([SETUP.md](SETUP.md))
2. Verify database schema execution
3. Configure Google OAuth
4. Test authentication flow

---

Built with ❤️ for ephemeral interactions
