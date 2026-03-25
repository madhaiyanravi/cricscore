'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { publicScoreApi } from '@/lib/api';
import { BallDetail, ScoreData } from '@/types';

export default function LiveMatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = Number(params.id);
  const token = searchParams.get('t') || '';

  const [score, setScore] = useState<ScoreData | null>(null);
  const [balls, setBalls] = useState<BallDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchScore = useCallback(async () => {
    if (!token) {
      setError('Missing spectator token');
      setLoading(false);
      return;
    }
    try {
      const { data } = await publicScoreApi.getScore(matchId, token);
      setScore(data);
      try {
        const ballsResp = await publicScoreApi.getBalls(matchId, token, data.inningsNumber);
        setBalls(ballsResp.data);
      } catch {
        // ignore ball-by-ball errors for spectator view
      }
      setError('');
    } catch (e: any) {
      setError(e.response?.status === 401 ? 'Invalid or expired link' : 'Failed to load live score');
    } finally {
      setLoading(false);
    }
  }, [matchId, token]);

  useEffect(() => {
    fetchScore();
    const iv = setInterval(fetchScore, 5000);
    return () => clearInterval(iv);
  }, [fetchScore]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500 animate-pulse">Loading live…</p>
        </div>
      </>
    );
  }

  if (!score) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-red-400">{error || 'Match not found'}</p>
        </div>
      </>
    );
  }

  const [oversFull, oversPartial] = score.overs.split('.');
  const legalBalls = parseInt(oversFull) * 6 + parseInt(oversPartial || '0');
  const runRate = legalBalls > 0 ? (score.runs / (legalBalls / 6)).toFixed(2) : '0.00';

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-20">
        <div>
          <h1 className="font-display text-2xl font-bold text-white leading-tight">
            {score.teamAName}<span className="text-gray-500 text-base mx-2">vs</span>{score.teamBName}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Live · Innings {score.inningsNumber} · {score.battingTeamName} batting
          </p>
          {score.resultText ? <p className="text-xs text-emerald-300 mt-1">{score.resultText}</p> : null}
          {score.targetRuns ? (
            <p className="text-xs text-amber-300 mt-1">
              Target: {score.targetRuns} · Need {score.requiredRuns} in {score.remainingBalls} balls
              {score.requiredRuns != null && score.remainingBalls ? (
                <span className="text-amber-200">
                  {' '}· RRR {((score.requiredRuns / (score.remainingBalls / 6)) || 0).toFixed(2)}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="card p-6">
          <div className="font-display text-5xl font-extrabold text-white tracking-tight">
            {score.runs}
            <span className="text-gray-500 text-2xl font-bold">/{score.wickets}</span>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Overs: <span className="text-white font-semibold">{score.overs}</span> · RR:{' '}
            <span className="text-white font-semibold">{runRate}</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-500">Striker</span>
              <span className="text-white font-semibold">{score.strikerName || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Non-striker</span>
              <span className="text-white font-semibold">{score.nonStrikerName || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bowler</span>
              <span className="text-white font-semibold">{score.currentBowlerName || '—'}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-white mb-3">Recent balls</h2>
          {balls.length === 0 ? (
            <p className="text-sm text-gray-500">No balls yet</p>
          ) : (
            <div className="space-y-2">
              {balls.slice(Math.max(0, balls.length - 12)).map((b) => {
                const overBall = `${(b.overNumber ?? 0) + 1}.${b.ballNumber ?? 0}`;
                const isExtra = Boolean(b.extraType);
                const label =
                  b.isWicket
                    ? 'W'
                    : !isExtra
                      ? String(b.batRuns)
                      : b.extraType === 'WIDE'
                        ? `Wd ${b.extraRuns}`
                        : b.extraType === 'NO_BALL'
                          ? `NB +${b.batRuns}`
                          : `${b.extraType?.replace('_', ' ')} ${b.extraRuns}`;
                return (
                  <div key={b.id} className="flex items-center justify-between gap-3 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2">
                    <p className="text-sm text-gray-200 min-w-0 truncate">
                      <span className="text-gray-500 mr-2">{overBall}</span>
                      {b.batsmanName || '—'} vs {b.bowlerName || '—'}
                    </p>
                    <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full border ${
                      b.isWicket
                        ? 'bg-red-600/20 border-red-500/40 text-red-300'
                        : isExtra
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-white/5 border-white/10 text-gray-200'
                    }`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
