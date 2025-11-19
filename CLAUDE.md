# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a real-time raffle system built with Next.js 16, PostgreSQL (via Prisma 7), and Socket.io for live updates between an agent control panel and a public display.

## Prerequisites

This project requires Node.js 20.19+. Use fnm to switch to the correct version:

```bash
fnm use
```

This reads the `.node-version` file and activates the required Node version.

## Development Commands

```bash
# Start development server (includes Socket.io)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Seed database with sample data
npm run seed

# Regenerate Prisma client after schema changes
npm run prisma:generate

# Run database migrations
npx prisma migrate dev
```

## Architecture

### Custom Server Pattern
The app uses a custom server (`server.ts`) that combines Next.js with Socket.io on a single port. This is necessary because Socket.io requires persistent connections that Next.js API routes cannot maintain.

### Real-Time Communication Flow
```
Agent Panel (/agent) → Socket.io Server → Public Display (/display)
         ↓                    ↓
    emit events          broadcast to all clients
    (raffle, next,       (sync-state)
     previous, reset)
```

### Socket Events
- `raffle` - Select random winner for current item
- `next` - Move to next item
- `previous` - Go to previous item
- `reset` - Reset entire raffle
- `sync-state` - Broadcast current state to all clients

### Database Models (Prisma)
- `Item` - Raffle prizes with order, image, and winner reference
- `Participant` - People eligible to win (hasWon tracks elimination)
- `RaffleState` - Singleton tracking current item and status

### Key Files
- `server.ts` - Custom server with Socket.io event handlers and raffle logic
- `src/lib/prisma.ts` - Prisma client with PrismaPg adapter
- `src/lib/socket.ts` - Socket.io client utility and TypeScript types
- `prisma/seed.ts` - Sample data seeder

### Prisma 7 Configuration
Uses driver adapter pattern with `@prisma/adapter-pg`. The connection URL is configured in `prisma.config.ts` and loaded via dotenv.

## Environment Variables

Required in `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/rifa"
```

## API Routes
- `GET/POST/DELETE /api/items` - Manage raffle items
- `GET/POST/DELETE /api/participants` - Manage participants
- `GET /api/export` - Export results as CSV
