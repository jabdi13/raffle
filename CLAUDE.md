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
# Start unified development server (Next.js + Socket.io on same port)
npm run dev

# Start split architecture for testing (Next.js on :3000, Socket.io on :3001)
npm run dev:split

# Start only Socket.io server
npm run dev:socket

# Start only Next.js app
npm run dev:next

# Build for production
npm run build

# Start production server (unified)
npm run start

# Start production Socket.io server (split architecture)
npm run start:socket

# Lint code
npm run lint

# Seed database with sample data
npm run seed

# Regenerate Prisma client after schema changes
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Open Prisma Studio to view database
npm run prisma:studio
```

## Architecture

### Development: Unified Server Pattern
The app uses a custom server (`server.ts`) that combines Next.js with Socket.io on a single port for local development. This is convenient for development but not compatible with Vercel.

### Production: Split Architecture
For production deployment:
- **Frontend**: Next.js app deployed to Vercel (static/SSR)
- **Socket.io Server**: Standalone server (`socketio-server.ts`) deployed to Railway/Render
- **Database**: Aiven PostgreSQL (managed database)

See `DEPLOYMENT.md` for full deployment instructions.

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
- `server.ts` - Unified dev server (Next.js + Socket.io)
- `socketio-server.ts` - Standalone Socket.io server for production
- `src/lib/prisma.ts` - Prisma client with PrismaPg adapter
- `src/lib/socket.ts` - Socket.io client utility and TypeScript types
- `src/lib/db-config.ts` - Database connection pool with SSL configuration
- `prisma/seed.ts` - Sample data seeder
- `DEPLOYMENT.md` - Production deployment guide

### Database Configuration
Uses driver adapter pattern with `@prisma/adapter-pg`. SSL certificates are automatically configured based on database provider:
- **AWS RDS**: Uses `certs/aws-rds-global-bundle.pem`
- **Aiven**: Uses `certs/aiven-ca.pem`
- **Local**: No SSL

The connection logic is in `src/lib/db-config.ts` and automatically detects the provider from the connection string.

## Environment Variables

Required in `.env` (see `.env.example` for all options):
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/rifa"

# Socket.io Server (production only)
NEXT_PUBLIC_SOCKET_URL="https://your-socketio-server.railway.app"
ALLOWED_ORIGINS="https://your-app.vercel.app"
```

## API Routes
- `GET/POST/DELETE /api/items` - Manage raffle items
- `GET/POST/DELETE /api/participants` - Manage participants
- `GET /api/export` - Export results as CSV
