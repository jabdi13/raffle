# Deployment Guide

This application uses a **split architecture** for production deployment:
- **Frontend (Next.js)**: Deployed to Vercel
- **Socket.io Server**: Deployed to Railway or Render
- **Database**: Aiven PostgreSQL

## Architecture Overview

```
┌─────────────────┐
│  Vercel         │  ← Next.js app (static/SSR)
│  (Frontend)     │
└────────┬────────┘
         │
         ├─→ Railway/Render (Socket.io server)
         │   - Real-time WebSocket events
         │   - Raffle logic
         │
         └─→ Aiven PostgreSQL
             - Database
```

## Prerequisites

1. **Aiven PostgreSQL** database created and accessible
2. **Railway** or **Render** account for Socket.io server
3. **Vercel** account for frontend
4. **GitHub** repository (recommended for continuous deployment)

## Step 1: Deploy Socket.io Server to Railway

### 1.1 Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your raffle repository
4. Railway will auto-detect the Node.js project

### 1.2 Configure Environment Variables

In Railway project settings, add these environment variables:

```bash
# Database
DATABASE_URL=postgres://avnadmin:password@your-service.aivencloud.com:port/defaultdb

# Server Configuration
NODE_ENV=production
PORT=3001

# CORS - Set to your Vercel frontend URL after deployment
ALLOWED_ORIGINS=https://your-app.vercel.app

# Socket Port
SOCKET_PORT=3001
```

### 1.3 Upload Aiven CA Certificate

Railway doesn't have a built-in file upload, so use one of these methods:

**Option A: Commit certificate to repo (in .gitignore exception)**
```bash
# In .gitignore, add exception:
!certs/aiven-ca.pem
```

**Option B: Use Railway volume mount**
- Create a volume in Railway
- Mount to `/app/certs`
- Upload `aiven-ca.pem` via Railway CLI

### 1.4 Deploy

Railway will automatically deploy. The Socket.io server will be available at:
```
https://your-project.up.railway.app
```

Copy this URL - you'll need it for Vercel.

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"** → **"Import Git Repository"**
3. Select your raffle repository
4. Vercel will auto-detect Next.js

### 2.2 Configure Environment Variables

In Vercel project settings → Environment Variables, add:

```bash
# Database
DATABASE_URL=postgres://avnadmin:password@your-service.aivencloud.com:port/defaultdb

# Socket.io Server (from Railway deployment)
NEXT_PUBLIC_SOCKET_URL=https://your-project.up.railway.app
```

### 2.3 Upload Aiven CA Certificate

**Option A: Vercel CLI**
```bash
vercel env add AIVEN_CA_CERT
# Paste contents of certs/aiven-ca.pem
```

Then update `src/lib/db-config.ts` to read from environment variable:
```typescript
ca: process.env.AIVEN_CA_CERT || fs.readFileSync(...)
```

**Option B: Commit to repo** (simpler)
Add exception in `.gitignore`:
```bash
!certs/aiven-ca.pem
```

### 2.4 Deploy

Vercel will automatically build and deploy. Your app will be live at:
```
https://your-app.vercel.app
```

### 2.5 Update Railway CORS

Go back to Railway and update `ALLOWED_ORIGINS`:
```bash
ALLOWED_ORIGINS=https://your-app.vercel.app
```

## Step 3: Verify Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Open browser console → Network tab
3. Verify WebSocket connection to Railway Socket.io server
4. Test raffle functionality (agent panel + display)

## Local Development

### Unified Server (Current Setup)
```bash
npm run dev
# Runs Next.js + Socket.io on same server (localhost:3000)
```

### Split Architecture (Testing Production Setup)
```bash
# Terminal 1: Socket.io server
npm run dev:socket

# Terminal 2: Next.js app
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001 npm run dev:next

# Or use concurrently:
npm run dev:split
```

## Troubleshooting

### WebSocket Connection Failed
- Check `NEXT_PUBLIC_SOCKET_URL` is correct
- Verify `ALLOWED_ORIGINS` includes your Vercel URL
- Check Railway logs for errors

### Database Connection Failed
- Verify `DATABASE_URL` is correct
- Ensure Aiven CA certificate is uploaded
- Check Aiven firewall allows Railway/Vercel IPs (or set to allow all)

### CORS Errors
- Update `ALLOWED_ORIGINS` in Railway
- Ensure no trailing slashes in URLs
- Verify protocol (http vs https)

## Environment Variables Summary

### Railway (Socket.io Server)
```bash
DATABASE_URL=<aiven-connection-string>
NODE_ENV=production
SOCKET_PORT=3001
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Vercel (Frontend)
```bash
DATABASE_URL=<aiven-connection-string>
NEXT_PUBLIC_SOCKET_URL=https://your-project.up.railway.app
```

## Alternative: Deploy to Render

If using Render instead of Railway:

1. Create **Web Service** in Render
2. Set **Build Command**: `npm install`
3. Set **Start Command**: `npm run start:socket`
4. Add same environment variables as Railway
5. Use Render service URL for `NEXT_PUBLIC_SOCKET_URL`

## Notes

- Railway provides automatic HTTPS
- Vercel provides automatic HTTPS
- Both services support custom domains
- Consider setting up monitoring (Railway/Vercel dashboards)
- Enable auto-deploy from GitHub for continuous deployment
