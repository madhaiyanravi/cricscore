'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { matchesApi, publicScoreApi } from '@/lib/api';
import { MatchSummary } from '@/types';

function SummaryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = Number(params.id);
  const token = searchParams.get('t') || '';

  const [summary, setSummary] = useState<MatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [momId, setMomId] = useState<number | ''>('');

  const fetchSummary = useCallback(async () => {
    try {
      setError('');
      const { data } = token
        ? await publicScoreApi.getSummary(matchId, token)
        : await matchesApi.getSummary(matchId);
      setSummary(data);
      if (data?.match?.manOfTheMatchPlayerId) setMomId(data.match.manOfTheMatchPlayerId);
    } catch (e: any) {
      setError(e.response?.status === 401 ? 'Invalid or expired link' : (e.response?.data?.error || 'Failed to load summary'));
    } finally {
      setLoading(false);
    }
  }, [matchId, token]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const allPlayers = useMemo(() => {
    const map = new Map<number, string>();
    (summary?.innings || []).forEach((inn) => {
      inn.battingCard?.forEach((b) => map.set(b.playerId, b.name));
      inn.bowlingCard?.forEach((b) => map.set(b.playerId, b.name));
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [summary]);

  const setMom = async () => {
    if (!momId) return;
    setSaving(true);
    setError('');
    try {
      await matchesApi.setMom(matchId, Number(momId));
      await fetchSummary();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to set MOM');
    } finally {
      setSaving(false);
    }
  };

  const autoMom = async () => {
    setSaving(true);
    setError('');
    try {
      await matchesApi.autoMom(matchId);
      await fetchSummary();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to auto-pick MOM');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500 animate-pulse">Loading summary…</p>
        </div>
      </>
    );
  }

  if (!summary) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-red-400">{error || 'Summary not found'}</p>
        </div>
      </>
    );
  }

  const match = summary.match;

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-24">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-white leading-tight">
              {match.teamAName}<span className="text-gray-500 text-base mx-2">vs</span>{match.teamBName}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Match Summary</p>
            {match.resultText ? <p className="text-xs text-emerald-300 mt-1">{match.resultText}</p> : null}
          </div>
          <a
            href={`/match/${matchId}`}
            className="text-xs text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-2 rounded-lg font-semibold"
          >
            Back to scoring →
          </a>
        </div>

        {/* MOM */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-white">Man of the Match</h2>
            <div className="flex gap-2">
              <button onClick={autoMom} disabled={saving || token.length > 0} className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-3 py-2 rounded-lg font-semibold disabled:opacity-40">
                Auto pick
              </button>
              <button onClick={setMom} disabled={saving || !momId || token.length > 0} className="btn-primary px-4 py-2 text-sm disabled:opacity-40">
                Save
              </button>
            </div>
          </div>

          {token ? (
            <p className="text-xs text-gray-500">Read-only view (spectator link). MOM can be set by scorer.</p>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Selected</label>
              <select className="input" value={momId} onChange={(e) => setMomId(e.target.value ? Number(e.target.value) : '')} disabled={token.length > 0}>
                <option value="">Select…</option>
                {allPlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {match.manOfTheMatchPlayerName ? (
                <p className="text-xs text-gray-500 mt-2">
                  Current: <span className="text-white font-semibold">{match.manOfTheMatchPlayerName}</span>
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Top suggestions</label>
              <div className="space-y-2">
                {(summary.momCandidates || []).length === 0 ? (
                  <p className="text-sm text-gray-500">Not enough data yet</p>
                ) : (
                  summary.momCandidates.slice(0, 5).map((c) => (
                    <div key={c.playerId} className="flex items-center justify-between text-sm bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-white truncate">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">Runs {c.runs} · Wkts {c.wickets}</p>
                      </div>
                      <button
                        onClick={() => setMomId(c.playerId)}
                        disabled={token.length > 0}
                        className="text-xs text-sky-300 bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40"
                      >
                        Pick ({c.points.toFixed(1)})
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {error ? <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg">{error}</div> : null}
        </div>

        {/* Innings */}
        {(summary.innings || []).map((inn) => (
          <div key={inn.inningsNumber} className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">
                  Innings {inn.inningsNumber}: {inn.battingTeamName}
                </h2>
                <p className="text-sm text-gray-300 mt-1">
                  <span className="text-white font-semibold">{inn.runs}/{inn.wickets}</span> in {inn.overs} overs
                  {inn.targetRuns ? <span className="text-amber-300"> · Target {inn.targetRuns}</span> : null}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Extras: <span className="text-white font-semibold">{inn.extrasTotal}</span>
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>Bowling: {inn.bowlingTeamName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Batting</h3>
                <div className="space-y-2">
                  {inn.battingCard.map((b) => (
                    <div key={b.playerId} className="flex items-center justify-between text-sm bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-white truncate">{b.name} {!b.out ? <span className="text-xs text-emerald-300">not out</span> : null}</p>
                        {b.out && b.dismissal ? <p className="text-xs text-gray-500 truncate">{b.dismissal}</p> : null}
                      </div>
                      <div className="text-right shrink-0 pl-3">
                        <p className="text-white font-semibold">{b.runs} ({b.balls})</p>
                        <p className="text-xs text-gray-500">4s {b.fours} · 6s {b.sixes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Bowling</h3>
                <div className="space-y-2">
                  {inn.bowlingCard.map((b) => (
                    <div key={b.playerId} className="flex items-center justify-between text-sm bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-white truncate">{b.name}</p>
                        <p className="text-xs text-gray-500 truncate">O {b.overs} · M {b.maidens} · Econ {b.economy.toFixed(2)}</p>
                      </div>
                      <div className="text-right shrink-0 pl-3">
                        <p className="text-white font-semibold">{b.wickets}/{b.runs}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Fall of wickets</h3>
              {(inn.fallOfWickets || []).length === 0 ? (
                <p className="text-sm text-gray-500">No wickets</p>
              ) : (
                <div className="flex flex-wrap gap-2 text-xs">
                  {inn.fallOfWickets.map((w) => (
                    <span key={`${inn.inningsNumber}-${w.wicketNumber}`} className="px-2 py-1 rounded-full border border-[#30363d] bg-[#0d1117] text-gray-300">
                      {w.wicketNumber}: <span className="text-white font-semibold">{w.score}</span> ({w.overs}) · {w.batsmanName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </main>
    </>
  );
}

export default withAuth(SummaryPage);

