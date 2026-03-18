'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { scoreApi } from '@/lib/api';
import { ScoreData, BallResult } from '@/types';

function ballLabel(b: BallResult): { text: string; cls: string } {
  if (b.isWicket)                return { text: 'W',  cls: 'bg-red-600 border-red-500 text-white' };
  if (b.extraType === 'WIDE')    return { text: 'Wd', cls: 'bg-yellow-600/30 border-yellow-500 text-yellow-300' };
  if (b.extraType === 'NO_BALL') return { text: 'NB', cls: 'bg-orange-600/30 border-orange-500 text-orange-300' };
  if (b.runs === 4) return { text: '4', cls: 'bg-blue-600/30 border-blue-500 text-blue-300' };
  if (b.runs === 6) return { text: '6', cls: 'bg-purple-600/30 border-purple-500 text-purple-300' };
  if (b.runs === 0) return { text: '·', cls: 'bg-[#1c2330] border-[#30363d] text-gray-400' };
  return { text: String(b.runs),  cls: 'bg-[#1c2330] border-[#30363d] text-white' };
}

const RUN_BUTTONS = [0, 1, 2, 3, 4, 6];

function MatchPage() {
  const params  = useParams();
  const matchId = Number(params.id);

  const [score, setScore]           = useState<ScoreData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [undoing, setUndoing]       = useState(false);
  const [undoFlash, setUndoFlash]   = useState(false);
  const [currentBatsman, setCurrentBatsman] = useState('');
  const [extraType, setExtraType]   = useState<'WIDE' | 'NO_BALL' | null>(null);
  const [error, setError]           = useState('');
  const scoreRef = useRef<HTMLDivElement>(null);

  const fetchScore = useCallback(async () => {
    try {
      const { data } = await scoreApi.getScore(matchId);
      setScore(data);
    } catch {
      setError('Failed to load score');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchScore();
    const iv = setInterval(fetchScore, 5000);
    return () => clearInterval(iv);
  }, [fetchScore]);

  const pop = () => {
    if (!scoreRef.current) return;
    scoreRef.current.classList.remove('score-pop');
    void scoreRef.current.offsetWidth;
    scoreRef.current.classList.add('score-pop');
  };

  const recordBall = async (runs: number, isWicket = false) => {
    if (!score || score.status === 'COMPLETED' || submitting || undoing) return;
    setSubmitting(true); setError('');
    try {
      const { data } = await scoreApi.recordBall({ matchId, runs, extraType: extraType ?? undefined, isWicket, currentBatsman });
      setScore(data); setExtraType(null); pop();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record ball');
    } finally { setSubmitting(false); }
  };

  const handleUndo = async () => {
    if (!score || undoing || submitting) return;
    setUndoing(true); setError('');
    try {
      const { data } = await scoreApi.undoBall(matchId);
      setScore(data);
      setUndoFlash(true);
      setTimeout(() => setUndoFlash(false), 800);
      pop();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nothing to undo');
    } finally { setUndoing(false); }
  };

  if (loading) return (<><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-500 animate-pulse">Loading match…</p></div></>);
  if (!score)  return (<><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-red-400">{error || 'Match not found'}</p></div></>);

  const isCompleted = score.status === 'COMPLETED';
  const [oversFull, oversPartial] = score.overs.split('.');
  const legalBalls  = parseInt(oversFull) * 6 + parseInt(oversPartial || '0');
  const totalBalls  = score.totalOvers * 6;
  const remaining   = Math.max(0, totalBalls - legalBalls);
  const runRate     = legalBalls > 0 ? (score.runs / (legalBalls / 6)).toFixed(2) : '0.00';

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white leading-tight">
              {score.teamAName}<span className="text-gray-500 text-base mx-2">vs</span>{score.teamBName}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{score.totalOvers} overs</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold mt-1 ${isCompleted ? 'bg-gray-700/50 text-gray-400' : 'bg-[#1a7a3c]/30 text-[#2aad56] animate-pulse'}`}>
            {isCompleted ? 'DONE' : '● LIVE'}
          </span>
        </div>

        {/* Score hero */}
        <div className={`card p-6 text-center relative overflow-hidden transition-colors duration-300 ${undoFlash ? 'border-amber-500/50' : ''}`}>
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#1a7a3c 0,#1a7a3c 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />
          <div ref={scoreRef} className="relative">
            <div className="font-display text-7xl font-bold text-white leading-none">
              {score.runs}<span className="text-gray-500 text-4xl">/{score.wickets}</span>
            </div>
            <div className="text-[#2aad56] font-display text-2xl mt-1">
              {score.overs}<span className="text-gray-500 text-base ml-1">overs</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-3 text-sm text-gray-400">
            <span>RR <span className="text-white font-semibold">{runRate}</span></span>
            <span>Left <span className="text-white font-semibold">{remaining} balls</span></span>
          </div>
          <div className="mt-4 h-1.5 bg-[#30363d] rounded-full overflow-hidden">
            <div className="h-full bg-[#1a7a3c] rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (legalBalls / totalBalls) * 100)}%` }} />
          </div>
        </div>

        {/* Last 6 balls */}
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Last 6 balls</p>
          <div className="flex gap-2 min-h-[2.5rem] items-center">
            {score.lastSixBalls.length === 0
              ? <span className="text-gray-600 text-sm">No balls yet</span>
              : [...score.lastSixBalls].reverse().map((b) => {
                  const { text, cls } = ballLabel(b);
                  return <div key={b.id} className={`ball-dot ${cls}`}>{text}</div>;
                })}
          </div>
        </div>

        {/* Batsman */}
        <div className="card p-4 flex items-center gap-3">
          <span className="text-2xl">🏏</span>
          <input value={currentBatsman} onChange={(e) => setCurrentBatsman(e.target.value)} placeholder="Current batsman…" className="bg-transparent flex-1 text-white placeholder-gray-600 outline-none text-sm" disabled={isCompleted} />
          {score.currentBatsman && <span className="text-xs text-[#2aad56] font-medium truncate max-w-[120px]">{score.currentBatsman}</span>}
        </div>

        {/* Controls */}
        {!isCompleted ? (
          <div className="card p-5 space-y-4">
            {/* Title + Undo button */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Record Ball</p>
              <button
                onClick={handleUndo}
                disabled={undoing || submitting || score.lastSixBalls.length === 0}
                className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              >
                <span className={undoing ? 'animate-spin inline-block' : ''}>↩</span>
                {undoing ? 'Undoing…' : 'Undo Last'}
              </button>
            </div>

            {/* Extras */}
            <div className="flex gap-2">
              {(['WIDE', 'NO_BALL'] as const).map((et) => (
                <button key={et} onClick={() => setExtraType(extraType === et ? null : et)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${extraType === et ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-[#0d1117] border-[#30363d] text-gray-400 hover:border-amber-500/50'}`}>
                  {et.replace('_', ' ')}
                </button>
              ))}
              {extraType && <span className="text-xs text-amber-400 self-center ml-1">Extra · no legal delivery</span>}
            </div>

            {/* Run buttons */}
            <div className="grid grid-cols-6 gap-2">
              {RUN_BUTTONS.map((r) => (
                <button key={r} onClick={() => recordBall(r)} disabled={submitting || undoing}
                  className={`py-5 rounded-xl font-display text-2xl font-bold border transition-all disabled:opacity-40 active:scale-95 select-none
                    ${r === 4 ? 'border-blue-500/50 bg-blue-600/10 text-blue-300 hover:bg-blue-600/20'
                    : r === 6 ? 'border-purple-500/50 bg-purple-600/10 text-purple-300 hover:bg-purple-600/20'
                    : 'border-[#30363d] bg-[#0d1117] text-white hover:border-[#1a7a3c] hover:bg-[#1a7a3c]/10'}`}>
                  {r}
                </button>
              ))}
            </div>

            {/* Wicket */}
            <button onClick={() => recordBall(0, true)} disabled={submitting || undoing}
              className="btn-danger w-full py-4 font-display text-xl tracking-widest active:scale-95">
              ⚡ WICKET
            </button>

            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg">{error}</div>}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="font-display text-3xl font-bold text-white">Match Completed</h2>
            <p className="text-gray-400 text-sm mt-2">Final: <strong className="text-white">{score.runs}/{score.wickets}</strong> in {score.overs} overs</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 pb-2">
          {[{cls:'bg-red-600',label:'W'},{cls:'bg-blue-500',label:'4'},{cls:'bg-purple-500',label:'6'},{cls:'bg-yellow-500',label:'Wd'},{cls:'bg-orange-500',label:'NB'}].map((l) => (
            <span key={l.label} className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-full ${l.cls}`}/>{l.label}</span>
          ))}
        </div>
      </main>
    </>
  );
}

export default withAuth(MatchPage);
