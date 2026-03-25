export interface Team {
  id: number;
  name: string;
  players: Player[];
}

export interface Player {
  id: number;
  name: string;
}

export interface Match {
  id: number;
  teamAId?: number;
  teamBId?: number;
  teamAName: string;
  teamBName: string;
  totalOvers: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  resultText?: string | null;
  manOfTheMatchPlayerId?: number | null;
  manOfTheMatchPlayerName?: string | null;
}

export interface BallResult {
  id: number;
  overNumber: number;
  ballNumber: number;
  runs: number;
  batRuns?: number;
  extraRuns?: number;
  extraType: string | null;
  isWicket: boolean;
  wicketType?: string | null;
  wicketBatsmanId?: number | null;
  fielderId?: number | null;
}

export interface BallDetail {
  id: number;
  inningsNumber: number;
  overNumber: number;
  ballNumber: number;
  runs: number;
  batRuns: number;
  extraRuns: number;
  extraType: string | null;
  isWicket: boolean;
  batsmanId?: number | null;
  batsmanName?: string | null;
  bowlerId?: number | null;
  bowlerName?: string | null;
  wicketType?: string | null;
  wicketBatsmanId?: number | null;
  wicketBatsmanName?: string | null;
  fielderId?: number | null;
  fielderName?: string | null;
}

export interface BatterLine {
  playerId: number;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
  dismissal?: string;
}

export interface BowlerLine {
  playerId: number;
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface ScoreData {
  matchId: number;
  teamAName: string;
  teamBName: string;
  totalOvers: number;
  inningsNumber: number;
  battingTeamId: number;
  battingTeamName: string;
  bowlingTeamId: number;
  bowlingTeamName: string;
  runs: number;
  wickets: number;
  overs: string;
  strikerId?: number | null;
  strikerName?: string | null;
  nonStrikerId?: number | null;
  nonStrikerName?: string | null;
  currentBowlerId?: number | null;
  currentBowlerName?: string | null;
  targetRuns?: number | null;
  requiredRuns?: number | null;
  remainingBalls?: number | null;
  resultText?: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED';
  extrasTotal?: number | null;
  extrasBreakdown?: Record<string, number> | null;
  lastSixBalls: BallResult[];
  battingCard?: BatterLine[];
  bowlingCard?: BowlerLine[];
  overEnded?: boolean;
}

export interface PlayerProfile {
  id: number;
  name: string;
  avatarUrl?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  role?: string;
  jerseyNumber?: number;
  bio?: string;
  totalMatches: number;
  totalRuns: number;
  totalWickets: number;
  highestScore: number;
  totalFours: number;
  totalSixes: number;
  totalBallsFaced: number;
  battingAverage: number;
  strikeRate: number;
  bowlingAverage: number;
  economyRate: number;
}

export interface OverData {
  over: number;
  runs: number;
  wickets: number;
  runRate: number;
}

export interface MatchAnalytics {
  matchId: number;
  teamAName: string;
  teamBName: string;
  totalRuns: number;
  totalWickets: number;
  totalFours: number;
  totalSixes: number;
  totalExtras: number;
  dotBalls: number;
  topScorerName?: string;
  topScorerRuns?: number;
  topBowlerName?: string;
  topBowlerWickets?: number;
  overByOver: OverData[];
  runsBreakdown: Record<string, number>;
}

export interface WicketFall {
  wicketNumber: number;
  score: number;
  overs: string;
  batsmanId?: number | null;
  batsmanName?: string | null;
  wicketType?: string | null;
}

export interface InningsSummary {
  inningsNumber: number;
  battingTeamId: number;
  battingTeamName: string;
  bowlingTeamId: number;
  bowlingTeamName: string;
  runs: number;
  wickets: number;
  overs: string;
  extrasTotal: number;
  extrasBreakdown: Record<string, number>;
  targetRuns?: number | null;
  battingCard: BatterLine[];
  bowlingCard: BowlerLine[];
  fallOfWickets: WicketFall[];
}

export interface MomCandidate {
  playerId: number;
  name: string;
  points: number;
  runs: number;
  wickets: number;
}

export interface MatchSummary {
  match: Match;
  innings: InningsSummary[];
  momCandidates: MomCandidate[];
}
