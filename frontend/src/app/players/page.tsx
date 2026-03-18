'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { playersApi } from '@/lib/api';
import { PlayerProfile } from '@/types';

const ROLE_COLORS: Record<string, string> = {
  BATSMAN:        'bg-blue-500/20 text-blue-300 border-blue-500/30',
  BOWLER:         'bg-green-500/20 text-green-300 border-green-500/30',
  ALL_ROUNDER:    'bg-purple-500/20 text-purple-300 border-purple-500/30',
  WICKET_KEEPER:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const ROLE_ICON: Record<string, string> = {
  BATSMAN: '🏏', BOWLER: '🎳', ALL_ROUNDER: '⚡', WICKET_KEEPER: '🧤',
};

function PlayersPage() {
  const [players, setPlayers]   = useState<PlayerProfile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  useEffect(() => {
    playersApi.getAll()
      .then(({ data }) => setPlayers(data))
      .finally(() => setLoading(false));
  }, []);

  const roles = ['ALL', 'BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'];

  const filtered = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'ALL' || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Leaderboard by runs
  const topRunners  = [...players].sort((a, b) => b.totalRuns - a.totalRuns).slice(0, 3);
  const topWickets  = [...players].sort((a, b) => b.totalWickets - a.totalWickets).slice(0, 3);

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="font-display text-4xl font-bold text-white">Players</h1>
          <p className="text-gray-400 text-sm mt-1">Career stats and profiles</p>
        </div>

        {/* Mini leaderboards */}
        {!loading && players.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top run-scorers */}
            <div className="card p-5">
              <h2 className="font-display text-lg font-semibold text-white mb-3 flex items-center gap-2">
                🏏 <span>Top Run-Scorers</span>
              </h2>
              <div className="space-y-2">
                {topRunners.map((p, i) => (
                  <Link key={p.id} href={`/players/${p.id}`}
                    className="flex items-center justify-between hover:bg-[#1c2330] px-3 py-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`font-display text-lg font-bold w-6 text-center ${
                        i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : 'text-amber-700'
                      }`}>{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-[#1a7a3c]/30 flex items-center justify-center text-sm font-bold text-[#2aad56]">
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-white">{p.name}</span>
                    </div>
                    <span className="font-display text-xl font-bold text-[#2aad56]">{p.totalRuns}</span>
                  </Link>
                ))}
                {topRunners.length === 0 && <p className="text-gray-500 text-sm text-center py-2">No data yet</p>}
              </div>
            </div>

            {/* Top wicket-takers */}
            <div className="card p-5">
              <h2 className="font-display text-lg font-semibold text-white mb-3 flex items-center gap-2">
                🎳 <span>Top Wicket-Takers</span>
              </h2>
              <div className="space-y-2">
                {topWickets.map((p, i) => (
                  <Link key={p.id} href={`/players/${p.id}`}
                    className="flex items-center justify-between hover:bg-[#1c2330] px-3 py-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`font-display text-lg font-bold w-6 text-center ${
                        i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : 'text-amber-700'
                      }`}>{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-sm font-bold text-red-400">
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-white">{p.name}</span>
                    </div>
                    <span className="font-display text-xl font-bold text-red-400">{p.totalWickets}W</span>
                  </Link>
                ))}
                {topWickets.length === 0 && <p className="text-gray-500 text-sm text-center py-2">No data yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players…"
            className="input flex-1"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {roles.map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors ${
                  roleFilter === r
                    ? 'bg-[#1a7a3c] border-[#2aad56] text-white'
                    : 'bg-[#0d1117] border-[#30363d] text-gray-400 hover:border-[#1a7a3c]'
                }`}>
                {r === 'ALL' ? 'All' : r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Player grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-500 animate-pulse">Loading players…</div>
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center text-gray-500">
            {search || roleFilter !== 'ALL' ? 'No players match your filter.' : 'No players yet — add them via Teams.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <Link key={p.id} href={`/players/${p.id}`}>
                <div className="card p-5 hover:border-[#1a7a3c] transition-colors cursor-pointer group h-full">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1a7a3c]/20 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-[#1a7a3c]/30 transition-colors">
                      {p.avatarUrl
                        ? <img src={p.avatarUrl} alt={p.name} className="w-full h-full rounded-xl object-cover" />
                        : <span className="font-display text-2xl font-bold text-[#2aad56]">{p.name.charAt(0)}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{p.name}</p>
                      {p.jerseyNumber && <p className="text-xs text-gray-500">#{p.jerseyNumber}</p>}
                    </div>
                    {p.role && (
                      <span className={`ml-auto text-xs px-2 py-1 rounded-md border font-medium flex-shrink-0 ${ROLE_COLORS[p.role] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                        {ROLE_ICON[p.role]} {p.role.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Runs',    value: p.totalRuns,    color: 'text-[#2aad56]' },
                      { label: 'Wickets', value: p.totalWickets, color: 'text-red-400'   },
                      { label: 'HS',      value: p.highestScore, color: 'text-blue-400'  },
                    ].map(s => (
                      <div key={s.label} className="bg-[#0d1117] rounded-lg py-2 px-1">
                        <div className={`font-display text-xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Batting style badge */}
                  {(p.battingStyle || p.bowlingStyle) && (
                    <div className="flex gap-2 mt-3">
                      {p.battingStyle && (
                        <span className="text-xs text-gray-500 bg-[#0d1117] px-2 py-1 rounded">
                          🏏 {p.battingStyle.replace('_', '-')}
                        </span>
                      )}
                      {p.bowlingStyle && (
                        <span className="text-xs text-gray-500 bg-[#0d1117] px-2 py-1 rounded">
                          🎳 {p.bowlingStyle}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default withAuth(PlayersPage);
