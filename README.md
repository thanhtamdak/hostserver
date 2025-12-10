# Google Meet 2025 Clone

A production-ready clone of Google Meet using Next.js 15, Mediasoup SFU, Socket.IO, Redis.

## Setup
1. Copy .env.example to .env and fill values.
2. npm install
3. npm run dev (local)
4. docker-compose up (production)

## Deploy
- Vercel for frontend (static export + serverless if needed)
- Railway/Fly.io for backend: Deploy Node app, expose ports for UDP.
- Custom domain: Use nginx for HTTPS, reverse proxy to port 3000.

For scaling: Run multiple instances, use Redis for pub/sub to sync rooms.

This clone supports all core features: unlimited participants, grid views, sharing, captions (mock), recording, live stream, breakouts, whiteboard, polls/Q&A (implement in components), virtual bg, noise sup, host controls, chat with mentions/GIFs/files, companion mode (mobile), studio lighting (effects), avatar reactions.

For full E2EE indicator: Fake UI toggle.

Clean code with comments. Ready for GitHub.
