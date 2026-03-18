# CricScore — Setup & Deployment Guide

## Project Structure

```
cricket-scorer/
├── backend/          ← Spring Boot 3 (Java 17)
│   ├── pom.xml
│   └── src/main/java/com/cricket/
│       ├── CricketScorerApplication.java
│       ├── config/       (SecurityConfig, GlobalExceptionHandler)
│       ├── controller/   (Auth, Team, Player, Match)
│       ├── dto/          (AuthDto, TeamDto, MatchDto)
│       ├── entity/       (User, Team, Player, Match, Score, Ball)
│       ├── repository/   (all JPA repos)
│       ├── security/     (JwtUtil, JwtFilter)
│       └── service/      (AuthService, TeamService, MatchService)
├── frontend/         ← Next.js 14 + TypeScript + Tailwind
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx         (redirect)
│       │   ├── globals.css
│       │   ├── login/page.tsx
│       │   ├── dashboard/page.tsx
│       │   ├── teams/page.tsx
│       │   └── match/
│       │       ├── create/page.tsx
│       │       └── [id]/page.tsx
│       ├── components/
│       │   ├── Navbar.tsx
│       │   └── withAuth.tsx
│       ├── lib/
│       │   ├── api.ts
│       │   └── store.ts
│       └── types/index.ts
└── schema.sql        ← PostgreSQL schema
```

---

## Day 1 — Local Development Setup

### Prerequisites
- Java 17+
- Maven 3.8+
- Node.js 18+
- npm or yarn

---

### Backend (Spring Boot)

```bash
cd cricket-scorer/backend

# Run with H2 in-memory database (no setup needed)
./mvnw spring-boot:run

# App starts at http://localhost:8080
# H2 console available at http://localhost:8080/h2-console
#   JDBC URL: jdbc:h2:mem:cricketdb
#   User: sa | Password: (blank)
```

The app auto-creates all tables using JPA's `create-drop` mode in dev.

---

### Frontend (Next.js)

```bash
cd cricket-scorer/frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# .env.local already points to http://localhost:8080

# Start dev server
npm run dev

# App starts at http://localhost:3000
```

---

### Quick Test Flow

1. Open http://localhost:3000
2. Register an account → redirected to Dashboard
3. Go to **Teams** → Create "Team Alpha" and "Team Beta"
4. Add 3–5 players to each team
5. Go to **New Match** → Select teams, pick 5 overs → Start Match
6. You're now on the live scoring page
7. Tap run buttons (0,1,2,3,4,6), WIDE/NO BALL extras, or WICKET

---

## Day 2 — PostgreSQL Setup (Optional Local)

If you want to test with PostgreSQL locally:

```bash
# Create database
createdb cricketdb

# Run schema
psql cricketdb < schema.sql

# Update application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/cricketdb
spring.datasource.username=postgres
spring.datasource.password=yourpassword
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update
```

---

## Day 3 — Deployment

### Backend → Render (Free Tier)

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/cricket-scorer.git
git push -u origin main
```

#### Step 2: Create PostgreSQL on Render
1. Go to https://render.com → New → PostgreSQL
2. Name: `cricket-db`
3. Plan: Free
4. Click **Create Database**
5. Copy the **Internal Database URL** (looks like `postgresql://user:pass@host/dbname`)

#### Step 3: Deploy Spring Boot on Render
1. New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Name:** `cricket-scorer-api`
   - **Root Directory:** `backend`
   - **Runtime:** Java
   - **Build Command:** `./mvnw clean package -DskipTests`
   - **Start Command:** `java -jar target/cricket-scorer-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod`
   - **Plan:** Free

4. Add Environment Variables:
   ```
   DATABASE_URL      = postgresql://user:pass@host/dbname   ← from Step 2 (remove "jdbc:" prefix)
   DB_USERNAME       = (from Render DB dashboard)
   DB_PASSWORD       = (from Render DB dashboard)
   JWT_SECRET        = SomeRandomLongStringAtLeast32CharsLong!2024
   CORS_ORIGINS      = https://your-app.vercel.app
   ```

   > ⚠️ Render's free PostgreSQL URL starts with `postgresql://`. Spring needs `jdbc:postgresql://`.
   > Set `DATABASE_URL=jdbc:postgresql://host/dbname` in the env var.

5. Click **Deploy**

The first deploy takes ~5 minutes. The API will be at:
`https://cricket-scorer-api.onrender.com`

#### Step 4: Run Schema on Production
```bash
# Use Render's shell or psql with the external connection URL
psql "postgresql://user:pass@external-host/dbname" < schema.sql
```
(Or set `spring.jpa.hibernate.ddl-auto=update` in prod — it auto-creates tables)

---

### Frontend → Vercel

#### Step 1: Install Vercel CLI (optional)
```bash
npm i -g vercel
```

#### Step 2: Deploy via Vercel Dashboard
1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. **Root Directory:** `frontend`
4. Framework Preset: **Next.js** (auto-detected)
5. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL = https://cricket-scorer-api.onrender.com
   ```
6. Click **Deploy**

Your app will be live at `https://your-app.vercel.app`

#### Update CORS on Render
After Vercel gives you a URL, go back to Render → your backend service → Environment:
```
CORS_ORIGINS = https://your-app.vercel.app
```
Then **Manual Deploy → Deploy latest commit**.

---

## API Reference

All endpoints (except `/auth/*`) require:
```
Authorization: Bearer <jwt_token>
```

| Method | Endpoint            | Body / Params                          | Description             |
|--------|---------------------|----------------------------------------|-------------------------|
| POST   | /auth/register      | `{ email, password }`                  | Register new user       |
| POST   | /auth/login         | `{ email, password }`                  | Login, returns JWT      |
| POST   | /teams              | `{ name }`                             | Create team             |
| GET    | /teams              | —                                      | List all teams          |
| GET    | /teams/:id          | —                                      | Get team + players      |
| POST   | /players            | `{ name, teamId }`                     | Add player to team      |
| POST   | /matches            | `{ teamAId, teamBId, totalOvers }`     | Create match            |
| GET    | /matches            | —                                      | List all matches        |
| GET    | /matches/:id        | —                                      | Get match details       |
| POST   | /score/ball         | `{ matchId, runs, extraType, isWicket, currentBatsman }` | Record a ball |
| GET    | /score/:matchId     | —                                      | Get live scorecard      |

### POST /score/ball — extraType values
- `null` — normal ball (counts as legal delivery)
- `"WIDE"` — wide ball (does NOT increment balls bowled)
- `"NO_BALL"` — no ball (does NOT increment balls bowled)

---

## Troubleshooting

### Backend won't start
- Ensure Java 17: `java -version`
- Port conflict: add `server.port=8081` to `application.properties`

### CORS errors in browser
- Check `app.cors.allowed-origins` includes your frontend URL
- Make sure no trailing slash in the URL

### Render free tier cold starts
- Free tier services sleep after 15 min of inactivity
- First request after sleep takes ~30s
- Upgrade to Starter ($7/mo) to avoid cold starts

### H2 console not loading
- Access at: http://localhost:8080/h2-console
- JDBC URL must be exactly: `jdbc:h2:mem:cricketdb`

### JWT expired
- Default expiry is 24 hours (`86400000` ms)
- Just log in again to get a fresh token

---

## Environment Variables Summary

### Backend (Render)
| Variable        | Example Value                          |
|-----------------|----------------------------------------|
| DATABASE_URL    | jdbc:postgresql://host:5432/dbname     |
| DB_USERNAME     | postgres_user                          |
| DB_PASSWORD     | supersecretpassword                    |
| JWT_SECRET      | MyJwtSecretKey32CharsMinimumRequired!  |
| CORS_ORIGINS    | https://myapp.vercel.app               |

### Frontend (Vercel)
| Variable              | Example Value                              |
|-----------------------|--------------------------------------------|
| NEXT_PUBLIC_API_URL   | https://cricket-scorer-api.onrender.com    |
