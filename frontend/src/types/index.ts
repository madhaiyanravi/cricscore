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
  teamAName: string;
  teamBName: string;
  totalOvers: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
}

export interface BallResult {
  id: number;
  overNumber: number;
  ballNumber: number;
  runs: number;
  extraType: string | null;
  isWicket: boolean;
}

export interface ScoreData {
  matchId: number;
  teamAName: string;
  teamBName: string;
  totalOvers: number;
  runs: number;
  wickets: number;
  overs: string;
  currentBatsman: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED';
  lastSixBalls: BallResult[];
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
