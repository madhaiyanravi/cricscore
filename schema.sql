-- CricScore v2 — PostgreSQL Schema
-- PR-1: PWA + Undo  |  PR-2: Player Profiles + Analytics

CREATE TABLE IF NOT EXISTS users (
    id       BIGSERIAL PRIMARY KEY,
    email    VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
    id                   BIGSERIAL PRIMARY KEY,
    name                 VARCHAR(255) NOT NULL,
    team_id              BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    -- Profile
    avatar_url           VARCHAR(500),
    batting_style        VARCHAR(20),   -- RIGHT_HAND, LEFT_HAND
    bowling_style        VARCHAR(20),   -- FAST, MEDIUM, SPIN
    role                 VARCHAR(30),   -- BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER
    jersey_number        INT,
    bio                  TEXT,
    -- Career stats (cached)
    total_matches        INT NOT NULL DEFAULT 0,
    total_runs           INT NOT NULL DEFAULT 0,
    total_wickets        INT NOT NULL DEFAULT 0,
    highest_score        INT NOT NULL DEFAULT 0,
    total_fours          INT NOT NULL DEFAULT 0,
    total_sixes          INT NOT NULL DEFAULT 0,
    total_balls_faced    INT NOT NULL DEFAULT 0,
    total_balls_bowled   INT NOT NULL DEFAULT 0,
    total_runs_conceded  INT NOT NULL DEFAULT 0,
    total_dismissals     INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS matches (
    id           BIGSERIAL PRIMARY KEY,
    team_a_id    BIGINT NOT NULL REFERENCES teams(id),
    team_b_id    BIGINT NOT NULL REFERENCES teams(id),
    total_overs  INT    NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    toss_winner_team_id BIGINT REFERENCES teams(id),
    toss_decision       VARCHAR(10), -- BAT, BOWL
    winner_team_id      BIGINT REFERENCES teams(id),
    result_text         VARCHAR(200),
    man_of_the_match_player_id BIGINT REFERENCES players(id),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    venue        VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS innings (
    id                BIGSERIAL PRIMARY KEY,
    match_id          BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    innings_number    INT    NOT NULL, -- 1 or 2
    batting_team_id   BIGINT NOT NULL REFERENCES teams(id),
    bowling_team_id   BIGINT NOT NULL REFERENCES teams(id),
    runs              INT NOT NULL DEFAULT 0,
    wickets           INT NOT NULL DEFAULT 0,
    balls_bowled      INT NOT NULL DEFAULT 0, -- legal deliveries only
    striker_id        BIGINT REFERENCES players(id),
    non_striker_id    BIGINT REFERENCES players(id),
    current_bowler_id BIGINT REFERENCES players(id),
    target_runs       INT,
    status            VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS'
);

CREATE TABLE IF NOT EXISTS scores (
    id               BIGSERIAL PRIMARY KEY,
    match_id         BIGINT NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
    runs             INT NOT NULL DEFAULT 0,
    wickets          INT NOT NULL DEFAULT 0,
    balls_bowled     INT NOT NULL DEFAULT 0,
    current_batsman  VARCHAR(255),
    current_bowler   VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS balls (
    id          BIGSERIAL PRIMARY KEY,
    match_id    BIGINT  NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    innings_number INT  NOT NULL DEFAULT 1,
    over_number INT     NOT NULL,
    ball_number INT     NOT NULL,
    runs        INT     NOT NULL DEFAULT 0,
    bat_runs    INT     NOT NULL DEFAULT 0,
    extra_runs  INT     NOT NULL DEFAULT 0,
    extra_type  VARCHAR(20),        -- WIDE, NO_BALL, BYE, LEG_BYE, PENALTY, null
    is_wicket   BOOLEAN NOT NULL DEFAULT FALSE,
    wicket_type VARCHAR(20),        -- BOWLED, CAUGHT, RUN_OUT, STUMPED, LBW
    wicket_batsman_id BIGINT REFERENCES players(id),
    fielder_id  BIGINT REFERENCES players(id),
    batsman_id  BIGINT  REFERENCES players(id),
    bowler_id   BIGINT  REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS match_analytics (
    id                BIGSERIAL PRIMARY KEY,
    match_id          BIGINT NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
    top_scorer_name   VARCHAR(255),
    top_scorer_runs   INT,
    top_bowler_name   VARCHAR(255),
    top_bowler_wickets INT,
    total_fours       INT NOT NULL DEFAULT 0,
    total_sixes       INT NOT NULL DEFAULT 0,
    total_extras      INT NOT NULL DEFAULT 0,
    dot_balls         INT NOT NULL DEFAULT 0,
    total_wickets     INT NOT NULL DEFAULT 0,
    over_by_over_runs VARCHAR(500)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_balls_match_id     ON balls(match_id);
CREATE INDEX IF NOT EXISTS idx_innings_match_id   ON innings(match_id);
CREATE INDEX IF NOT EXISTS idx_innings_match_inn  ON innings(match_id, innings_number);
CREATE INDEX IF NOT EXISTS idx_players_team_id    ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_scores_match_id    ON scores(match_id);
CREATE INDEX IF NOT EXISTS idx_balls_batsman_id   ON balls(batsman_id);
CREATE INDEX IF NOT EXISTS idx_balls_bowler_id    ON balls(bowler_id);
