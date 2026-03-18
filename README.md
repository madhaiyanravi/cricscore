# 🏏 CricScore v2

Cricket scoring MVP with **7 features across 2 PRs**, built on top of v1.

## What's new in v2

| Feature | PR | Status |
|---|---|---|
| Mobile PWA (installable, offline-capable) | PR-1 | ✅ |
| Undo last ball | PR-1 | ✅ |
| Player profiles + career stats | PR-2 | ✅ |
| Match analytics dashboard | PR-2 | ✅ |

## Quick Start

```bash
# Backend (H2 in-memory)
cd backend && ./mvnw spring-boot:run

# Frontend
cd frontend && npm install && npm run dev
```

Open http://localhost:3000

## Generate PWA icons (run once)
```bash
cd frontend && node generate-icons.js
```

## New API Endpoints (v2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | `/score/ball/last/{matchId}` | Undo last ball |
| GET    | `/players` | All players with career stats |
| GET    | `/players/{id}` | Single player profile |
| PUT    | `/players/{id}` | Update player profile |
| GET    | `/analytics/match/{matchId}` | Full match analytics |

## See CHANGELOG.md for full diff details.
