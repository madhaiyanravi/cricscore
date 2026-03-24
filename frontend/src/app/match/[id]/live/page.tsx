'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { publicScoreApi } from '@/lib/api';
import { ScoreData } from '@/types';

export default function LiveMatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = Number(params.id);
  const token = searchParams.get('t') || '';

  const [score, setScore] = useState<ScoreData | null>(null);
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
      </main>
    </>
  );
}
