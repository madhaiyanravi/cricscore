'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { publicScoreApi } from '@/lib/api';
import { BallDetail, ScoreData } from '@/types';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

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
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-center text-muted">
           <p className="animate-pulse text-lg font-medium">Connecting to live feed...</p>
        </main>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
           <div className="text-4xl mb-4">🚫</div>
           <p className="text-red-400 font-bold">{error || 'Match not found'}</p>
        </main>
      </div>
    );
  }

  const [oversFull, oversPartial] = score.overs.split('.');
  const legalBalls = parseInt(oversFull) * 6 + parseInt(oversPartial || '0');
  const runRate = legalBalls > 0 ? (score.runs / (legalBalls / 6)).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-background text-text transition-colors duration-200">
      <Navbar />
      
      {/* Sticky Score Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border py-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
         <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
            <div className="flex flex-col">
               <div className="text-xs font-black uppercase tracking-widest text-muted leading-none mb-1">Live Score</div>
               <div className="text-lg font-black tracking-tight leading-none">
                  {score.battingTeamName} <span className="text-primary">{score.runs}/{score.wickets}</span>
                  <span className="text-muted ml-2 font-bold text-xs uppercase">({score.overs} OV)</span>
               </div>
            </div>
            <div className="text-right">
               <Badge variant="primary" className="font-black">RR: {runRate}</Badge>
            </div>
         </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8 pb-32">
        {/* Match Info */}
        <div className="space-y-4 text-center">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter">
            {score.teamAName} <span className="text-muted/40 mx-2">vs</span> {score.teamBName}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">LIVE SPECTATOR VIEW</Badge>
            {score.resultText && <Badge variant="success">{score.resultText}</Badge>}
          </div>
          {score.targetRuns && (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl max-w-lg mx-auto">
               <p className="text-primary font-bold text-sm">
                 TARGET: {score.targetRuns} · Need {score.requiredRuns} from {score.remainingBalls} balls
               </p>
               <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">
                 Required Run Rate: {((score.requiredRuns! / (score.remainingBalls! / 6)) || 0).toFixed(2)}
               </p>
            </div>
          )}
        </div>

        {/* Players Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="p-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-6 px-2">Current Batters</h2>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-muted/5 rounded-2xl border border-primary/20 shadow-sm shadow-primary/5 relative">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-full" />
                    <div className="flex items-center gap-3">
                       <span className="text-primary text-xl">🏏</span>
                       <div className="font-black text-lg">{score.strikerName || '—'}</div>
                    </div>
                    <Badge variant="primary">Striker</Badge>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-muted/5 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-3">
                       <span className="text-muted text-xl opacity-50">🏏</span>
                       <div className="font-bold text-muted">{score.nonStrikerName || '—'}</div>
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="p-6 flex flex-col justify-center text-center space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted">Active Bowler</h2>
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto border-2 border-success/30 border-dashed">
                 <span className="text-3xl">🎳</span>
              </div>
              <div>
                 <div className="text-2xl font-black">{score.currentBowlerName || '—'}</div>
                 <p className="text-xs font-black uppercase text-success tracking-widest mt-2">{score.bowlingTeamName} Attack</p>
              </div>
           </Card>
        </div>

        {/* Recent Balls */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted">Recent Ball-by-Ball</h2>
            <div className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Updated in Real-time</div>
          </div>
          
          {balls.length === 0 ? (
            <div className="py-12 text-center text-muted font-medium italic">Waiting for the first delivery...</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {balls.slice(-10).reverse().map((b, i) => {
                const overBall = `${(b.overNumber ?? 0) + 1}.${b.ballNumber ?? 0}`;
                const isExtra = Boolean(b.extraType);
                const isWicket = b.isWicket;
                const label = isWicket ? 'W' : !isExtra ? String(b.batRuns) : b.extraType === 'WIDE' ? `Wd` : b.extraType === 'NO_BALL' ? `Nb` : b.extraType?.substring(0, 1);
                const extraVal = isExtra ? (b.extraRuns || 1) : '';

                return (
                  <div key={b.id} className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all animate-in slide-in-from-right-4 group",
                    i === 0 ? "bg-primary/5 border-primary/20 scale-102" : "bg-muted/5 border-border/40"
                  )} style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-muted w-10">{overBall}</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm group-hover:text-primary transition-colors">
                          {b.batsmanName || '—'} vs {b.bowlerName || '—'}
                        </span>
                        {isWicket && (
                          <span className="text-[10px] font-black uppercase text-danger mt-0.5">
                            OUT: {b.wicketType?.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {isExtra && <span className="text-[10px] font-black text-warning">+{extraVal}</span>}
                       <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 shadow-sm transition-transform group-hover:rotate-12",
                        isWicket ? "bg-danger border-danger/50 text-white shadow-danger/20" : 
                        isExtra ? "bg-warning/20 border-warning text-warning shadow-warning/10" :
                        b.batRuns === 4 ? "bg-primary border-primary shadow-primary/20 text-white" :
                        b.batRuns === 6 ? "bg-purple-600 border-purple-400 shadow-purple-200 text-white" :
                        "bg-background border-border text-text"
                       )}>
                        {label}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
