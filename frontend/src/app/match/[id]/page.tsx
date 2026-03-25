'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { matchesApi, scoreApi, teamsApi } from '@/lib/api';
import { ScoreData, Team, Player, BatterLine, BowlerLine, BallDetail } from '@/types';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/providers/ToastProvider';

type ExtraType = 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | 'PENALTY' | null;
type WicketType = 'BOWLED' | 'CAUGHT' | 'RUN_OUT' | 'STUMPED' | 'LBW';

function MatchPage() {
  const params = useParams();
  const matchId = Number(params.id);
  const { toast } = useToast();

  const [score, setScore] = useState<ScoreData | null>(null);
  const [match, setMatch] = useState<any>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [error, setError] = useState('');

  const [extraType, setExtraType] = useState<ExtraType>(null);

  const [strikerId, setStrikerId] = useState<number | ''>('');
  const [nonStrikerId, setNonStrikerId] = useState<number | ''>('');
  const [bowlerId, setBowlerId] = useState<number | ''>('');

  const [showWicket, setShowWicket] = useState(false);
  const [wicketType, setWicketType] = useState<WicketType>('BOWLED');
  const [outBatsmanId, setOutBatsmanId] = useState<number | ''>('');
  const [fielderId, setFielderId] = useState<number | ''>('');
  const [newBatsmanId, setNewBatsmanId] = useState<number | ''>('');

  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const [showOverPrompt, setShowOverPrompt] = useState(false);
  const [view, setView] = useState<'scorecard' | 'balls'>('scorecard');
  const [balls, setBalls] = useState<BallDetail[]>([]);
  const [ballsLoading, setBallsLoading] = useState(false);

  const scoreRef = useRef<HTMLDivElement>(null);

  const fetchBalls = useCallback(async (inningsNumber?: number) => {
    try {
      setBallsLoading(true);
      const { data } = await scoreApi.getBalls(matchId, inningsNumber);
      setBalls(data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load ball-by-ball');
    } finally {
      setBallsLoading(false);
    }
  }, [matchId]);

  const fetchAll = useCallback(async () => {
    try {
      const [{ data: matchData }, { data: scoreData }] = await Promise.all([
        matchesApi.getOne(matchId),
        scoreApi.getScore(matchId),
      ]);
      setMatch(matchData);
      setScore(scoreData);

      // Keep local selections in sync with backend state
      if (scoreData?.strikerId) setStrikerId(scoreData.strikerId);
      if (scoreData?.nonStrikerId) setNonStrikerId(scoreData.nonStrikerId);
      if (scoreData?.currentBowlerId) setBowlerId(scoreData.currentBowlerId);

      const [ta, tb] = await Promise.all([
        teamsApi.getOne(matchData.teamAId),
        teamsApi.getOne(matchData.teamBId),
      ]);
      setTeamA(ta.data);
      setTeamB(tb.data);

      if (scoreData?.overEnded) setShowOverPrompt(true);
      if (view === 'balls' && scoreData?.inningsNumber) {
        void fetchBalls(scoreData.inningsNumber);
      }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load match');
    } finally {
      setLoading(false);
    }
  }, [fetchBalls, matchId, view]);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(() => {
      fetchAll();
    }, 5000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  useEffect(() => {
    if (view === 'balls' && score?.inningsNumber) {
      void fetchBalls(score.inningsNumber);
    }
  }, [fetchBalls, score?.inningsNumber, view]);

  const battingTeam = useMemo(() => {
    if (!score || !teamA || !teamB) return null;
    return score.battingTeamId === teamA.id ? teamA : teamB;
  }, [score, teamA, teamB]);

  const bowlingTeam = useMemo(() => {
    if (!score || !teamA || !teamB) return null;
    return score.bowlingTeamId === teamA.id ? teamA : teamB;
  }, [score, teamA, teamB]);

  const battingPlayers: Player[] = battingTeam?.players || [];
  const bowlingPlayers: Player[] = bowlingTeam?.players || [];

  const pop = () => {
    if (!scoreRef.current) return;
    scoreRef.current.classList.remove('score-pop');
    void scoreRef.current.offsetWidth;
    scoreRef.current.classList.add('score-pop');
  };

  const idsReady = strikerId && nonStrikerId && bowlerId;
  const isCompleted = score?.status === 'COMPLETED';

  const runButtons = [0, 1, 2, 3, 4, 6];

  const recordBall = async (runs: number, isWicket = false) => {
    if (!score || submitting || undoing || isCompleted) return;
    if (!idsReady) {
      setError('Select striker, non-striker and bowler.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload: any = {
        matchId,
        isWicket,
        extraType: extraType ?? null,
        batsmanId: Number(strikerId),
        nonStrikerId: Number(nonStrikerId),
        bowlerId: Number(bowlerId),
      };

      if (extraType === 'WIDE' || extraType === 'BYE' || extraType === 'LEG_BYE' || extraType === 'PENALTY') {
        payload.batRuns = 0;
        payload.extraRuns = runs;
      } else if (extraType === 'NO_BALL') {
        payload.batRuns = runs;
        payload.extraRuns = 0;
      } else {
        payload.batRuns = runs;
        payload.extraRuns = 0;
      }

      if (isWicket) {
        payload.wicketType = wicketType;
        payload.wicketBatsmanId = outBatsmanId ? Number(outBatsmanId) : Number(strikerId);
        payload.fielderId = fielderId ? Number(fielderId) : null;
        payload.newBatsmanId = newBatsmanId ? Number(newBatsmanId) : null;
      }

      const { data } = await scoreApi.recordBall(payload);
      setScore(data);
      setExtraType(null);
      setShowWicket(false);
      setShowOverPrompt(Boolean(data.overEnded));
      if (view === 'balls') void fetchBalls(data.inningsNumber);

      if (data?.strikerId) setStrikerId(data.strikerId);
      if (data?.nonStrikerId) setNonStrikerId(data.nonStrikerId);
      if (data?.currentBowlerId) setBowlerId(data.currentBowlerId);

      // reset wicket modal state
      setOutBatsmanId('');
      setFielderId('');
      setNewBatsmanId('');

      pop();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record ball');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!score || undoing || submitting) return;
    setUndoing(true);
    setError('');
    try {
      const { data } = await scoreApi.undoBall(matchId);
      setScore(data);
      if (view === 'balls') void fetchBalls(data.inningsNumber);
      pop();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nothing to undo');
    } finally {
      setUndoing(false);
    }
  };

  const startSecondInnings = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await matchesApi.startSecondInnings(matchId);
      setScore(data);
      setStrikerId('');
      setNonStrikerId('');
      setBowlerId('');
      if (view === 'balls') void fetchBalls(data.inningsNumber);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start 2nd innings');
    } finally {
      setSubmitting(false);
    }
  };

  const openWicketModal = () => {
    if (!idsReady) {
      setError('Select striker, non-striker and bowler.');
      return;
    }
    setWicketType('BOWLED');
    setOutBatsmanId(Number(strikerId));
    setFielderId('');
    setNewBatsmanId('');
    setShowWicket(true);
  };

  const createShareLink = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await matchesApi.spectateToken(matchId);
      const url = `${window.location.origin}/match/${matchId}/live?t=${data.token}`;
      setShareUrl(url);
      setShowShare(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create live link');
    } finally {
      setSubmitting(false);
    }
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-6">🏜️</div>
          <h2 className="text-2xl font-black text-muted">Match Not Found</h2>
          <p className="text-muted/60 mt-2 mb-8">{error || 'The match you are looking for does not exist or has been removed.'}</p>
          <Link href="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </main>
      </div>
    );
  }

  const [oversFull, oversPartial] = score.overs.split('.');
  const legalBalls = parseInt(oversFull) * 6 + parseInt(oversPartial || '0');
  const runRate = legalBalls > 0 ? (score.runs / (legalBalls / 6)).toFixed(2) : '0.00';
  const showStart2nd =
    score.status === 'IN_PROGRESS' &&
    score.inningsNumber === 1 &&
    (score.remainingBalls === 0 || score.wickets >= 10);

  return (
    <div className="min-h-screen bg-background text-text transition-colors duration-200">
      <Navbar />
      
      {/* Sticky Quick Score Bar */}
      {!isCompleted && (
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border py-3 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
           <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
              <div className="flex flex-col">
                 <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 leading-none mb-1">Live Console</div>
                 <div className="text-lg font-black tracking-tighter leading-none flex items-center gap-2">
                    {score.battingTeamName} 
                    <span className="text-primary font-black">{score.runs}/{score.wickets}</span>
                    <span className="text-muted font-bold text-[10px] uppercase">({score.overs} OV)</span>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-black text-muted uppercase tracking-widest">Curr RR</div>
                    <div className="text-xs font-black">{runRate}</div>
                 </div>
                 <Button variant="ghost" size="sm" onClick={handleUndo} disabled={undoing || submitting || (score.lastSixBalls?.length || 0) === 0} className="h-8 px-2 text-warning hover:bg-warning/10">
                    {undoing ? '...' : '↩ Undo'}
                 </Button>
              </div>
           </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-32">
        {/* Match Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter">
               {score.teamAName} <span className="text-muted/40 mx-2 italic font-light">vs</span> {score.teamBName}
            </h1>
            <div className="flex items-center gap-2">
               <Badge variant={isCompleted ? 'success' : 'primary'} className="font-black tracking-widest uppercase py-1">
                 {isCompleted ? 'Match Finished' : `Innings ${score.inningsNumber}`}
               </Badge>
               {score.resultText && <Badge variant="outline" className="text-primary border-primary/30 font-bold">{score.resultText}</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
             <Link href={`/match/${matchId}/summary`}>
                <Button variant="outline" size="sm">Summary View</Button>
             </Link>
             <Button variant="outline" size="sm" onClick={createShareLink} disabled={submitting}>Share Link</Button>
          </div>
        </div>

        {/* Real-time Status & Target */}
        {score.targetRuns && !isCompleted && (
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 text-primary/10 select-none font-black italic text-4xl group-hover:scale-110 transition-transform">THE CHASE</div>
             <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                   <p className="text-primary font-black text-xl mb-1 flex items-center gap-2">
                     <span className="animate-pulse">🎯</span> Need {score.requiredRuns} runs in {score.remainingBalls} balls
                   </p>
                   <p className="text-[10px] text-muted font-black uppercase tracking-[0.2em]">Target Score: {score.targetRuns}</p>
                </div>
                <div className="text-right">
                   <div className="text-xs font-black text-muted uppercase tracking-widest">Required RR</div>
                   <div className="text-2xl font-black text-primary leading-none">
                      {((score.requiredRuns! / (score.remainingBalls! / 6)) || 0).toFixed(2)}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Global Score Card */}
        <Card ref={scoreRef} className="p-8 relative overflow-hidden transition-all duration-300 hover:border-primary/30 group">
           <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
           <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="text-center md:text-left space-y-1">
                 <p className="text-xs font-black uppercase tracking-[0.3em] text-muted">{score.battingTeamName} Batting</p>
                 <div className="text-7xl font-black tracking-tighter transition-all">
                    {score.runs}
                    <span className="text-muted/40 text-4xl ml-1">/{score.wickets}</span>
                 </div>
                 <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                    <div className="text-sm font-black text-muted uppercase tracking-widest">
                       Overs <span className="text-text ml-1">{score.overs}</span><span className="text-muted/40 font-light mx-2">/</span>{score.totalOvers}
                    </div>
                    <div className="text-sm font-black text-muted uppercase tracking-widest">
                       Run Rate <span className="text-primary ml-1">{runRate}</span>
                    </div>
                 </div>
              </div>

              {/* Last 6 Deliveries Visualization */}
              <div className="w-full md:w-auto text-center md:text-right">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-4">Last Deliveries</p>
                 <div className="flex items-center justify-center md:justify-end gap-2.5">
                    {score.lastSixBalls?.slice(-6).map((ball, idx) => {
                      const isWicket = ball.isWicket;
                      const isExtra = !!ball.extraType;
                      const scoreLabel = isWicket ? 'W' : isExtra ? (ball.extraType === 'WIDE' ? 'Wd' : ball.extraType === 'NO_BALL' ? 'NB' : ball.runs) : ball.runs;
                      const isHighScale = ball.runs === 4 || ball.runs === 6;
                      
                      return (
                        <div 
                          key={ball.id || idx} 
                          className={cn(
                             "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all border-2 shadow-sm animate-in fade-in zoom-in slide-in-from-right-4",
                             isWicket ? "bg-danger border-danger/50 text-white shadow-danger/20" : 
                             isExtra ? "bg-warning/20 border-warning/50 text-warning" :
                             isHighScale ? "bg-primary border-primary shadow-primary/20 text-white scale-110" :
                             "bg-muted/5 border-border/50 text-muted"
                          )}
                          style={{ animationDelay: `${idx * 100}ms` }}
                        >
                           {scoreLabel}
                        </div>
                      );
                    })}
                    {(!score.lastSixBalls || score.lastSixBalls.length === 0) && (
                       <div className="text-xs text-muted/40 font-bold italic py-2">Waiting for first ball...</div>
                    )}
                 </div>
              </div>
           </div>
        </Card>

        {/* Player Selection & Active Players */}
        {!isCompleted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="p-6 border-l-4 border-l-primary ring-1 ring-primary/5">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-xl">🏏</div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-text">Batting Duo</h3>
                      <p className="text-[10px] text-muted font-bold tracking-tight uppercase">Select striker and non-striker</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <Select
                      label="Striker (On Strike)"
                      value={strikerId}
                      onChange={(e) => setStrikerId(e.target.value ? Number(e.target.value) : '')}
                      options={[
                        { label: 'Select Batsman', value: '' },
                        ...battingPlayers.map(p => ({ label: p.name, value: String(p.id) }))
                      ]}
                   />
                   <Select
                      label="Non-Striker"
                      value={nonStrikerId}
                      onChange={(e) => setNonStrikerId(e.target.value ? Number(e.target.value) : '')}
                      options={[
                        { label: 'Select Batsman', value: '' },
                        ...battingPlayers.map(p => ({ label: p.name, value: String(p.id) }))
                      ]}
                   />
                </div>
             </Card>

             <Card className="p-6 border-l-4 border-l-warning ring-1 ring-warning/5">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 bg-warning/10 rounded-2xl flex items-center justify-center text-warning text-xl">⚾</div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-text">Bowling Attack</h3>
                      <p className="text-[10px] text-muted font-bold tracking-tight uppercase">Active bowler for this over</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <Select
                      label="Current Bowler"
                      value={bowlerId}
                      onChange={(e) => setBowlerId(e.target.value ? Number(e.target.value) : '')}
                      options={[
                        { label: 'Select Bowler', value: '' },
                        ...bowlingPlayers.map(p => ({ label: p.name, value: String(p.id) }))
                      ]}
                   />
                </div>
             </Card>
          </div>
        )}

        {/* Innings Break Alert */}
        {showStart2nd && (
          <div className="bg-success/5 border border-success/20 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in zoom-in duration-500">
            <div>
              <p className="text-success font-black text-xl">Innings Break</p>
              <p className="text-sm text-muted font-bold mt-1 tracking-tight">The first innings has concluded. Ready to start the chase?</p>
            </div>
            <Button onClick={startSecondInnings} isLoading={submitting} className="bg-success hover:bg-success/90 py-6 px-8 text-lg font-black uppercase tracking-widest shadow-xl shadow-success/20">
              Start 2nd Innings →
            </Button>
          </div>
        )}

        {/* Scoring Console */}
        {!isCompleted && !showStart2nd && (
          <Card className="p-8 space-y-8 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
               <div className="flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text">Scoring Console</h3>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-tight">Tap to record delivery</p>
               </div>
               {extraType && (
                 <Badge variant="warning" className="animate-pulse shadow-lg shadow-warning/10 font-black">
                    {extraType.replace('_', ' ')} ACTIVE
                 </Badge>
               )}
            </div>

            {/* Extras Selection */}
            <div className="flex flex-wrap gap-3 relative z-10">
              {(['WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'PENALTY'] as const).map((et) => (
                <button
                  key={et}
                  onClick={() => setExtraType(extraType === et ? null : et)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-300",
                    extraType === et
                      ? "bg-warning border-warning text-background shadow-lg shadow-warning/20 transform -translate-y-1"
                      : "bg-muted/5 border-border/50 text-muted hover:border-warning/50 hover:text-warning"
                  )}
                >
                  {et.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Run Buttons Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 relative z-10">
              {runButtons.map((r) => (
                <button
                  key={r}
                  onClick={() => recordBall(r, false)}
                  disabled={submitting || undoing || !idsReady}
                  className={cn(
                    "h-20 sm:h-24 rounded-2xl font-black text-3xl transition-all duration-300 transform active:scale-95 disabled:opacity-20 border-2",
                    r === 4 ? "bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/5 hover:bg-primary hover:text-white" :
                    r === 6 ? "bg-accent/10 border-accent/30 text-accent shadow-lg shadow-accent/5 hover:bg-accent hover:text-white" :
                    "bg-muted/5 border-border/50 text-text hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Wicket Button */}
            <div className="relative z-10">
               <button
                  onClick={openWicketModal}
                  disabled={submitting || undoing || !idsReady}
                  className="w-full h-20 bg-danger text-white rounded-2xl font-black text-xl uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl shadow-danger/20 hover:bg-danger/90 transition-all duration-300 active:scale-98 disabled:opacity-20"
               >
                  <span className="text-2xl">⚡</span> OUT / WICKET
               </button>
            </div>

            {!idsReady && (
               <div className="bg-warning/5 border border-warning/20 p-4 rounded-2xl flex items-center gap-3 animate-bounce">
                  <span className="text-xl">⚠️</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-warning">Select Batsmen and Bowler to unlock controls</p>
               </div>
            )}
            
            {error && (
              <div className="bg-danger/10 border border-danger/30 p-4 rounded-2xl text-xs font-bold text-danger animate-shake">
                 {error}
              </div>
            )}
          </Card>
        )}

        {/* View Selection Tabs */}
        <div className="flex bg-muted/5 p-1.5 rounded-2xl border border-border/50">
          {(['scorecard', 'balls'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                view === v
                  ? "bg-text text-background shadow-lg scale-102"
                  : "text-muted hover:text-text hover:bg-muted/10"
              )}
            >
              {v === 'scorecard' ? 'Detailed Scorecard' : 'Ball By Ball Activity'}
            </button>
          ))}
        </div>

        {view === 'scorecard' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Extras Summary */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-black uppercase tracking-widest text-text">Extras Summary</h3>
                 <div className="text-2xl font-black text-primary">{score.extrasTotal ?? 0}</div>
              </div>
              <div className="flex flex-wrap gap-3">
                {Object.entries(score.extrasBreakdown || {}).map(([k, v]) => (
                  <div key={k} className="flex flex-col bg-muted/5 border border-border/50 px-4 py-2 rounded-xl min-w-[80px]">
                    <span className="text-[10px] font-black uppercase text-muted tracking-tighter">{k.replace('_', ' ')}</span>
                    <span className="text-sm font-black text-text">{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Scorecard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-6 overflow-hidden">
                <h3 className="text-sm font-black uppercase tracking-widest text-text mb-6 flex items-center gap-2">
                   <span className="w-1.5 h-4 bg-primary rounded-full" /> Batting Scorecard
                </h3>
                <div className="space-y-4">
                  {(score.battingCard || []).length === 0 ? (
                    <div className="text-center py-8 opacity-20 font-black uppercase tracking-widest text-xs italic">No batting stats yet</div>
                  ) : (
                    (score.battingCard as BatterLine[]).map((b) => (
                      <div key={b.playerId} className={cn("flex items-center justify-between group transition-all", !b.out && "bg-primary/5 -mx-2 px-2 py-1 rounded-xl")}>
                        <div className="min-w-0 pr-4">
                          <p className="font-black text-sm text-text truncate">
                            {b.name}
                            {!b.out && <span className="ml-2 inline-block w-2 h-2 bg-success rounded-full animate-pulse" />}
                          </p>
                          {b.out && b.dismissal ? (
                             <p className="text-[10px] text-muted font-bold truncate tracking-tight mt-0.5">{b.dismissal}</p>
                          ) : (
                             <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest mt-0.5">Not Out</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-lg text-text leading-none">{b.runs} <span className="text-[10px] text-muted font-bold">({b.balls})</span></p>
                          <p className="text-[10px] text-muted font-bold tracking-tighter mt-1">4s: {b.fours} · 6s: {b.sixes}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-6 overflow-hidden">
                <h3 className="text-sm font-black uppercase tracking-widest text-text mb-6 flex items-center gap-2">
                   <span className="w-1.5 h-4 bg-warning rounded-full" /> Bowlingcard
                </h3>
                <div className="space-y-4">
                  {(score.bowlingCard || []).length === 0 ? (
                     <div className="text-center py-8 opacity-20 font-black uppercase tracking-widest text-xs italic">No bowling stats yet</div>
                  ) : (
                    (score.bowlingCard as BowlerLine[]).map((b) => (
                      <div key={b.playerId} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0 hover:border-warning/30 transition-colors">
                        <div className="min-w-0 pr-2">
                          <p className="font-black text-sm text-text truncate">{b.name}</p>
                          <p className="text-[10px] text-muted font-bold tracking-widest mt-1">O {b.overs} · M {b.maidens} · EC {b.economy.toFixed(2)}</p>
                        </div>
                        <div className="text-right shrink-0 bg-warning/5 px-3 py-2 rounded-xl border border-warning/10">
                          <p className="font-black text-warning text-lg leading-none">{b.wickets}<span className="text-muted/40 text-xs ml-0.5">/</span>{b.runs}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <Card className="p-8">
              <div className="flex items-center justify-between gap-4 mb-8">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text">Activity Timeline</h3>
                <Button variant="ghost" size="sm" onClick={() => score?.inningsNumber && fetchBalls(score.inningsNumber)} className="h-8 text-[10px] font-black uppercase tracking-widest border border-border">
                   Refresh Feed
                </Button>
              </div>

              {ballsLoading ? (
                <div className="space-y-4">
                   <Skeleton className="h-20 rounded-2xl" />
                   <Skeleton className="h-20 rounded-2xl" />
                   <Skeleton className="h-20 rounded-2xl" />
                </div>
              ) : balls.length === 0 ? (
                <div className="text-center py-20">
                   <div className="text-4xl mb-4">⏱️</div>
                   <p className="text-muted font-black uppercase tracking-widest text-xs">Waiting for live action...</p>
                </div>
              ) : (
                <div className="space-y-10 relative">
                  <div className="absolute left-4 top-2 bottom-0 w-0.5 bg-border/20" />
                  {(() => {
                    const grouped = balls.reduce<Record<string, BallDetail[]>>((acc, b) => {
                      const key = String((b.overNumber ?? 0) + 1);
                      acc[key] = acc[key] || [];
                      acc[key].push(b);
                      return acc;
                    }, {});
                    return Object.keys(grouped)
                      .sort((a, b) => Number(b) - Number(a)) // show latest over first
                      .map((over) => [over, grouped[over]] as const);
                  })().map(([over, overBalls]) => (
                    <div key={over} className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                         <div className="w-8 h-8 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                         </div>
                         <h4 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Over {over}</h4>
                      </div>
                      <div className="space-y-1 ml-10">
                        {overBalls.sort((a,b) => b.ballNumber - a.ballNumber).map((b) => {
                          const overBall = `${(b.overNumber ?? 0) + 1}.${b.ballNumber ?? 0}`;
                          const isWicket = b.isWicket;
                          const isExtra = !!b.extraType;
                          const ballLabel = isWicket ? 'W' : !isExtra ? b.batRuns : (b.extraType === 'WIDE' ? 'Wd' : b.extraType === 'NO_BALL' ? 'NB' : b.extraType?.charAt(0));
                          
                          return (
                            <div key={b.id} className="flex items-center justify-between gap-4 group p-3 rounded-2xl hover:bg-muted/5 border border-transparent hover:border-border/50 transition-all">
                              <div className="min-w-0">
                                <p className="text-sm font-black text-text group-hover:text-primary transition-colors">
                                  <span className="text-[10px] text-muted font-bold mr-3">{overBall}</span>
                                  {b.batsmanName} <span className="text-muted/40 italic mx-1">vs</span> {b.bowlerName}
                                </p>
                                {isWicket && (
                                   <p className="text-[10px] text-danger font-black uppercase tracking-widest mt-1">
                                      {b.wicketType?.replace('_', ' ')} · Out
                                   </p>
                                )}
                              </div>
                              {/* circular run indicators as requested */}
                              <div className={cn(
                                 "w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center font-black text-sm border-2 shadow-sm transition-transform group-hover:scale-110",
                                 isWicket ? "bg-danger border-danger/50 text-white" :
                                 isExtra ? "bg-warning/10 border-warning/50 text-warning" :
                                 (b.batRuns === 4 || b.batRuns === 6) ? "bg-primary border-primary text-white" :
                                 "bg-muted/5 border-border/50 text-muted"
                              )}>
                                 {ballLabel}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Action Modals */}
        <Modal 
          isOpen={showOverPrompt && !isCompleted && !showStart2nd} 
          onClose={() => setShowOverPrompt(false)} 
          title="Over Completed"
        >
          <div className="space-y-6">
             <div className="text-center py-4">
                <div className="text-6xl mb-4">🏁</div>
                <p className="text-muted font-bold italic tracking-tight uppercase text-xs">Great Over!</p>
                <h4 className="text-xl font-black text-text mt-2 tracking-tighter">Choose the next bowler to continue the attack.</h4>
             </div>
             <Button className="w-full py-6 text-lg font-black uppercase tracking-widest" onClick={() => setShowOverPrompt(false)}>
                Ready for Next Over
             </Button>
          </div>
        </Modal>

        <Modal
          isOpen={showWicket}
          onClose={() => setShowWicket(false)}
          title="⚡ Wicket Confirmation"
        >
           <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); recordBall(0, true); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <Select
                    label="Method of Dismissal"
                    value={wicketType}
                    onChange={(e) => setWicketType(e.target.value as WicketType)}
                    options={(['BOWLED', 'CAUGHT', 'RUN_OUT', 'STUMPED', 'LBW'] as const).map(wt => ({ label: wt.replace('_', ' '), value: wt }))}
                 />
                 <Select
                    label="Batsman Out"
                    value={outBatsmanId}
                    onChange={(e) => setOutBatsmanId(e.target.value ? Number(e.target.value) : '')}
                    options={[
                      { label: 'Select Batsman', value: '' },
                      ...[strikerId, nonStrikerId].filter(Boolean).map(id => {
                        const p = battingPlayers.find(x => x.id === Number(id));
                        return { label: p?.name || 'Unknown', value: String(id) };
                      })
                    ]}
                 />
                 <Select
                    label="Assistant Fielder (Optional)"
                    value={fielderId}
                    onChange={(e) => setFielderId(e.target.value ? Number(e.target.value) : '')}
                    options={[
                      { label: 'None', value: '' },
                      ...bowlingPlayers.map(p => ({ label: p.name, value: String(p.id) }))
                    ]}
                 />
                 <Select
                    label="Incoming Batsman"
                    value={newBatsmanId}
                    onChange={(e) => setNewBatsmanId(e.target.value ? Number(e.target.value) : '')}
                    options={[
                      { label: 'Select Incoming', value: '' },
                      ...battingPlayers.filter(p => !score.battingCard?.find(bc => bc.playerId === p.id)).map(p => ({ label: p.name, value: String(p.id) }))
                    ]}
                 />
              </div>

              <div className="flex gap-4 pt-4">
                 <Button variant="ghost" type="button" onClick={() => setShowWicket(false)} className="flex-1 py-4 uppercase font-black tracking-widest">Cancel</Button>
                 <Button type="submit" isLoading={submitting} className="flex-[2] bg-danger hover:bg-danger/90 py-4 uppercase font-black tracking-widest shadow-xl shadow-danger/10 text-white">
                    Confirm Wicket
                 </Button>
              </div>
           </form>
        </Modal>

        <Modal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          title="🔗 Share Live Feed"
        >
           <div className="space-y-6">
              <p className="text-xs text-muted font-bold leading-relaxed uppercase tracking-widest">
                 Spectators can track this match real-time via the following link. Access is read-only.
              </p>
              <div className="bg-muted/10 border-2 border-dashed border-border p-5 rounded-2xl break-all font-mono text-xs text-text/80 shadow-inner">
                 {shareUrl}
              </div>
              <div className="flex gap-4">
                 <Button variant="secondary" className="flex-1 py-4 uppercase font-black tracking-widest" onClick={copyShare}>
                    Copy Link
                 </Button>
                 <Button variant="outline" className="flex-1 py-4 uppercase font-black tracking-widest" onClick={() => setShowShare(false)}>
                    Close
                 </Button>
              </div>
           </div>
        </Modal>
      </main>
    </div>
  );
}

export default withAuth(MatchPage);
