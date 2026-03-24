'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { matchesApi, scoreApi, teamsApi } from '@/lib/api';
import { ScoreData, Team, Player, BatterLine, BowlerLine } from '@/types';

type ExtraType = 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | 'PENALTY' | null;
type WicketType = 'BOWLED' | 'CAUGHT' | 'RUN_OUT' | 'STUMPED' | 'LBW';

function MatchPage() {
  const params = useParams();
  const matchId = Number(params.id);

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

  const scoreRef = useRef<HTMLDivElement>(null);

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
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load match');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(() => {
      fetchAll();
    }, 5000);
    return () => clearInterval(iv);
  }, [fetchAll]);

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
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500 animate-pulse">Loading match…</p>
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
  const showStart2nd =
    score.status === 'IN_PROGRESS' &&
    score.inningsNumber === 1 &&
    (score.remainingBalls === 0 || score.wickets >= 10);

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-24">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-white leading-tight">
              {score.teamAName}
              <span className="text-gray-500 text-base mx-2">vs</span>
              {score.teamBName}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Innings {score.inningsNumber} · {score.battingTeamName} batting · {score.totalOvers} overs
            </p>
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

          <div className="flex gap-2">
            <button
              onClick={createShareLink}
              disabled={submitting}
              className="text-xs text-sky-300 bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-40"
            >
              Share Live
            </button>
            <span className={`text-xs px-2 py-1 rounded-full border ${isCompleted ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' : 'border-amber-500/30 text-amber-300 bg-amber-500/10'}`}>
              {score.status === 'COMPLETED' ? 'Completed' : 'Live'}
            </span>
          </div>
        </div>

        {/* Score */}
        <div ref={scoreRef} className="card p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="font-display text-5xl font-extrabold text-white tracking-tight">
                {score.runs}
                <span className="text-gray-500 text-2xl font-bold">/{score.wickets}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Overs: <span className="text-white font-semibold">{score.overs}</span> · RR:{' '}
                <span className="text-white font-semibold">{runRate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Player selection */}
        {!isCompleted && (
          <div className="card p-5 space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Players</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Striker</label>
                <select className="input" value={strikerId} onChange={(e) => setStrikerId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Select…</option>
                  {battingPlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Non-striker</label>
                <select className="input" value={nonStrikerId} onChange={(e) => setNonStrikerId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Select…</option>
                  {battingPlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Bowler</label>
                <select className="input" value={bowlerId} onChange={(e) => setBowlerId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Select…</option>
                  {bowlingPlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Innings break */}
        {showStart2nd && (
          <div className="card p-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-white font-semibold">First innings completed</p>
              <p className="text-xs text-gray-400 mt-0.5">Start the chase to continue scoring.</p>
            </div>
            <button onClick={startSecondInnings} disabled={submitting} className="btn-primary px-4 py-2">
              Start 2nd Innings →
            </button>
          </div>
        )}

        {/* Controls */}
        {!isCompleted && !showStart2nd && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Record Ball</p>
              <button
                onClick={handleUndo}
                disabled={undoing || submitting || (score.lastSixBalls?.length || 0) === 0}
                className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              >
                <span className={undoing ? 'animate-spin inline-block' : ''}>↩</span>
                {undoing ? 'Undoing…' : 'Undo Last'}
              </button>
            </div>

            {/* Extras */}
            <div className="flex flex-wrap gap-2">
              {(['WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'PENALTY'] as const).map((et) => (
                <button
                  key={et}
                  onClick={() => setExtraType(extraType === et ? null : et)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                    extraType === et
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-[#0d1117] border-[#30363d] text-gray-400 hover:border-amber-500/50'
                  }`}
                >
                  {et.replace('_', ' ')}
                </button>
              ))}
              {extraType && (
                <span className="text-xs text-amber-400 self-center">
                  {extraType === 'NO_BALL' ? 'No-ball includes +1 extra' : extraType === 'WIDE' ? 'Wide includes +1 extra' : 'Extra runs'}
                </span>
              )}
            </div>

            {/* Run buttons */}
            <div className="grid grid-cols-6 gap-2">
              {runButtons.map((r) => (
                <button
                  key={r}
                  onClick={() => recordBall(r, false)}
                  disabled={submitting || undoing}
                  className={`py-5 rounded-xl font-display text-2xl font-bold border transition-all disabled:opacity-40 active:scale-95 select-none
                    ${r === 4 ? 'border-blue-500/50 bg-blue-600/10 text-blue-300 hover:bg-blue-600/20'
                      : r === 6 ? 'border-purple-500/50 bg-purple-600/10 text-purple-300 hover:bg-purple-600/20'
                        : 'border-[#30363d] bg-[#0d1117] text-white hover:border-[#1a7a3c] hover:bg-[#1a7a3c]/10'}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={openWicketModal}
              disabled={submitting || undoing}
              className="btn-danger w-full py-4 font-display text-xl tracking-widest active:scale-95"
            >
              ⚡ WICKET
            </button>

            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg">{error}</div>}
          </div>
        )}

        {/* Scorecard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-white mb-3">Batting</h2>
            <div className="space-y-2">
              {(score.battingCard || []).length === 0 ? (
                <p className="text-sm text-gray-500">No batting data yet</p>
              ) : (
                (score.battingCard as BatterLine[]).map((b) => (
                  <div key={b.playerId} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="text-white truncate">
                        {b.name}{' '}
                        {!b.out ? <span className="text-xs text-emerald-300">not out</span> : null}
                      </p>
                      {b.out && b.dismissal ? <p className="text-xs text-gray-500 truncate">{b.dismissal}</p> : null}
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <p className="text-white font-semibold">{b.runs} ({b.balls})</p>
                      <p className="text-xs text-gray-500">4s {b.fours} · 6s {b.sixes}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-white mb-3">Bowling</h2>
            <div className="space-y-2">
              {(score.bowlingCard || []).length === 0 ? (
                <p className="text-sm text-gray-500">No bowling data yet</p>
              ) : (
                (score.bowlingCard as BowlerLine[]).map((b) => (
                  <div key={b.playerId} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="text-white truncate">{b.name}</p>
                      <p className="text-xs text-gray-500 truncate">O {b.overs} · M {b.maidens} · Econ {b.economy.toFixed(2)}</p>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <p className="text-white font-semibold">{b.wickets}/{b.runs}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Over prompt */}
        {showOverPrompt && !isCompleted && !showStart2nd && (
          <div className="card p-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-white font-semibold">Over completed</p>
              <p className="text-xs text-gray-400 mt-0.5">Pick the next bowler before continuing.</p>
            </div>
            <button onClick={() => setShowOverPrompt(false)} className="text-xs text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-2 rounded-lg font-semibold">
              OK
            </button>
          </div>
        )}

        {/* Wicket modal */}
        {showWicket && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
            <div className="card w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold text-white">Wicket details</h3>
                <button onClick={() => setShowWicket(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Type</label>
                  <select className="input" value={wicketType} onChange={(e) => setWicketType(e.target.value as WicketType)}>
                    {(['BOWLED', 'CAUGHT', 'RUN_OUT', 'STUMPED', 'LBW'] as const).map((wt) => (
                      <option key={wt} value={wt}>{wt.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Batsman out</label>
                  <select className="input" value={outBatsmanId} onChange={(e) => setOutBatsmanId(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">Select…</option>
                    {[strikerId, nonStrikerId].filter(Boolean).map((id) => {
                      const pid = Number(id);
                      const p = battingPlayers.find((x) => x.id === pid);
                      return p ? <option key={p.id} value={p.id}>{p.name}</option> : null;
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Fielder (optional)</label>
                  <select className="input" value={fielderId} onChange={(e) => setFielderId(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">None</option>
                    {bowlingPlayers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">New batsman</label>
                  <select className="input" value={newBatsmanId} onChange={(e) => setNewBatsmanId(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">Select…</option>
                    {battingPlayers
                      .filter((p) => p.id !== Number(strikerId) && p.id !== Number(nonStrikerId))
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setShowWicket(false)} className="text-xs text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-2 rounded-lg font-semibold">
                  Cancel
                </button>
                <button
                  onClick={() => recordBall(0, true)}
                  className="btn-danger px-4 py-2 text-sm"
                  disabled={submitting}
                >
                  Confirm Wicket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share modal */}
        {showShare && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
            <div className="card w-full max-w-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold text-white">Live spectator link</h3>
                <button onClick={() => setShowShare(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <p className="text-xs text-gray-400">Anyone with this link can view the match live (read-only).</p>
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-xs text-gray-200 break-all">
                {shareUrl}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={copyShare} className="btn-primary px-4 py-2 text-sm">Copy</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default withAuth(MatchPage);
