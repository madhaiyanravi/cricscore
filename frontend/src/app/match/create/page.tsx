'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { teamsApi, matchesApi } from '@/lib/api';
import { Team } from '@/types';

const OVERS_OPTIONS = [5, 10, 15, 20];

function CreateMatchPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [totalOvers, setTotalOvers] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    teamsApi.getAll().then(({ data }) => setTeams(data));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (teamAId === teamBId) {
      setError('Team A and Team B must be different.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await matchesApi.create(Number(teamAId), Number(teamBId), totalOvers);
      router.push(`/match/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const teamA = teams.find(t => String(t.id) === teamAId);
  const teamB = teams.find(t => String(t.id) === teamBId);

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white">New Match</h1>
          <p className="text-gray-400 text-sm mt-1">Set up a new cricket match</p>
        </div>

        {teams.length < 2 && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-lg text-sm mb-6">
            ⚠️ You need at least 2 teams to create a match.{' '}
            <a href="/teams" className="underline hover:no-underline">Add teams →</a>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Team selection */}
          <div className="card p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold">Select Teams</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
                  Team A (Batting)
                </label>
                <select
                  value={teamAId}
                  onChange={(e) => setTeamAId(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Choose team…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
                  Team B (Bowling)
                </label>
                <select
                  value={teamBId}
                  onChange={(e) => setTeamBId(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Choose team…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* VS display */}
            {teamA && teamB && (
              <div className="flex items-center justify-center gap-4 py-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
                <span className="font-display text-lg font-bold text-white">{teamA.name}</span>
                <span className="text-[#2aad56] font-display text-xl font-bold">VS</span>
                <span className="font-display text-lg font-bold text-white">{teamB.name}</span>
              </div>
            )}
          </div>

          {/* Overs */}
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Match Overs</h2>
            <div className="grid grid-cols-4 gap-3">
              {OVERS_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setTotalOvers(o)}
                  className={`py-3 rounded-lg border font-display text-xl font-bold transition-all ${
                    totalOvers === o
                      ? 'bg-[#1a7a3c] border-[#2aad56] text-white'
                      : 'bg-[#0d1117] border-[#30363d] text-gray-400 hover:border-[#1a7a3c] hover:text-white'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Selected: {totalOvers} overs ({totalOvers * 6} balls)</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || teams.length < 2}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Creating…' : '🏏 Start Match'}
          </button>
        </form>
      </main>
    </>
  );
}

export default withAuth(CreateMatchPage);
