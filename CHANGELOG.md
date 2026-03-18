# CricScore v2 — PR Changelog

## PR-1: Mobile PWA + Undo Last Ball

### New Files
| File | Purpose |
|------|---------|
| `frontend/public/manifest.json` | PWA manifest — name, icons, display mode, shortcuts |
| `frontend/public/sw.js` | Service worker — offline caching, push handler stub |
| `frontend/public/offline.html` | Offline fallback page shown when no cache hit |
| `frontend/generate-icons.js` | One-time script to generate SVG app icons |
| `frontend/src/lib/usePWA.ts` | Hook — registers SW, captures install prompt, tracks online state |
| `frontend/src/components/InstallBanner.tsx` | Bottom banner with "Install App" button |
| `frontend/src/components/OfflineBadge.tsx` | Navbar badge shown when offline |

### Modified Files
| File | Change |
|------|--------|
| `frontend/src/app/layout.tsx` | Added PWA `<meta>` tags, `manifest` link, `<InstallBanner>` |
| `frontend/src/components/Navbar.tsx` | Added `<OfflineBadge>`, added Players + Analytics nav links |
| `frontend/src/lib/api.ts` | Added `scoreApi.undoBall()` |
| `frontend/src/app/match/[id]/page.tsx` | Added Undo Last Ball button with amber flash animation |

### Backend
| File | Change |
|------|--------|
| `MatchService.java` | Added `undoLastBall()` — reverses score, deletes last ball row |
| `MatchController.java` | Added `DELETE /score/ball/last/{matchId}` endpoint |

### How PWA Works
1. On first load, service worker caches all static assets and pages
2. Network-first for API calls, cache-first for static files
3. If offline, API calls return 503 JSON; pages fall back to cache
4. Install prompt captured and shown as `InstallBanner` on mobile
5. `OfflineBadge` appears in navbar when `navigator.onLine` is false

### Undo Flow
```
User taps "Undo Last" →
  DELETE /score/ball/last/{matchId} →
    Find last ball by matchId ordered by id →
    Subtract runs, decrement wickets if needed →
    Decrement ballsBowled if it was a legal delivery →
    Delete the ball row →
    Return updated ScoreResponse
Frontend score state updates with amber flash on the score hero
```

---

## PR-2: Player Profiles + Match Analytics

### New Files
| File | Purpose |
|------|---------|
| `frontend/src/app/players/page.tsx` | Player listing with search, role filter, leaderboards |
| `frontend/src/app/players/[id]/page.tsx` | Full player profile — stats, edit form, career overview |
| `frontend/src/app/analytics/page.tsx` | Analytics dashboard — bar chart, line chart, pie chart, table |

### Modified Files
| File | Change |
|------|--------|
| `frontend/src/types/index.ts` | Added `PlayerProfile`, `OverData`, `MatchAnalytics` types |
| `frontend/src/lib/api.ts` | Added `playersApi` and `analyticsApi` |
| `frontend/src/app/teams/page.tsx` | Add-player form now includes role, batting/bowling style, jersey # |
| `frontend/src/app/dashboard/page.tsx` | Each match card has "📊 Stats" link to analytics |
| `frontend/package.json` | Added `recharts` dependency |

### Backend
| File | Change |
|------|--------|
| `entity/Player.java` | Added profile fields (avatarUrl, battingStyle, bowlingStyle, role, jerseyNumber, bio) + career stats columns |
| `entity/Ball.java` | Added `batsmanId`, `bowlerId` FK columns |
| `entity/Score.java` | Added `currentBowler` field |
| `entity/MatchAnalytics.java` | **New** — pre-computed analytics cache table |
| `dto/TeamDto.java` | Extended with all new profile fields + computed batting/bowling averages |
| `dto/AnalyticsDto.java` | **New** — `OverData` + `MatchAnalyticsResponse` |
| `service/TeamService.java` | Full rewrite with profile CRUD, stat computations (avg, SR, economy) |
| `service/AnalyticsService.java` | **New** — aggregates balls into over-by-over, boundary counts, top performers |
| `controller/PlayerController.java` | Added `GET /players`, `GET /players/{id}`, `PUT /players/{id}` |
| `controller/AnalyticsController.java` | **New** — `GET /analytics/match/{matchId}` |
| `repository/MatchAnalyticsRepository.java` | **New** |
| `schema.sql` | Updated with all new columns and tables |

### Analytics Data Flow
```
GET /analytics/match/{matchId}
  → Load all Ball rows for match
  → Aggregate:
      - fours/sixes/extras/dots from ball.runs + ball.extraType
      - over-by-over: group by overNumber → sum runs, count wickets
      - run-rate: cumulative (runs / (balls/6)) per over
      - batsman totals: group by batsmanId → sum runs
      - bowler totals: group by bowlerId → count wickets
  → Find top scorer + top bowler via player lookup
  → Return MatchAnalyticsResponse with overByOver[]

Frontend renders:
  - BarChart (runs per over, red if wicket fell)
  - LineChart (run rate progression)
  - PieChart (DOT/SINGLE/TWO/FOUR/SIX/EXTRA/WICKET breakdown)
  - Scrollable over-by-over table
```
