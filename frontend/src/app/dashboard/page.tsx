'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { matchesApi } from '@/lib/api';
import { Match } from '@/types';

function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    matchesApi.getAll()
      .then(({ data }) => setMatches(data))
      .finally(() => setLoading(false));
  }, []);

  const live      = matches.filter(m => m.status === 'IN_PROGRESS');
  const completed = matches.filter(m => m.status === 'COMPLETED');

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Hero */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">All your matches in one place</p>
          </div>
          <Link href="/match/create" className="btn-primary">+ New Match</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total',     value: matches.length },
            { label: 'Live',      value: live.length    },
            { label: 'Completed', value: completed.length },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <div className="font-display text-3xl font-bold text-[#2aad56]">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500 animate-pulse">Loading…</div>
        ) : matches.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">🏏</div>
            <p className="text-gray-400 mb-4">No matches yet.</p>
            <Link href="/match/create" className="btn-primary inline-block">Create Match</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map(match => (
              <div key={match.id} className="card p-4 flex items-center gap-4">
                {/* Live dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  match.status === 'IN_PROGRESS' ? 'bg-[#2aad56] animate-pulse' : 'bg-gray-600'
                }`} />

                {/* Match info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">
                    {match.teamAName} <span className="text-gray-500">vs</span> {match.teamBName}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{match.totalOvers} overs</div>
                </div>

                {/* Status badge */}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                  match.status === 'IN_PROGRESS'
                    ? 'bg-[#1a7a3c]/30 text-[#2aad56]'
                    : 'bg-gray-700/50 text-gray-400'
                }`}>
                  {match.status === 'IN_PROGRESS' ? 'LIVE' : 'DONE'}
                </span>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/match/${match.id}`}
                    className="text-xs bg-[#1a7a3c]/20 hover:bg-[#1a7a3c]/40 text-[#2aad56] border border-[#1a7a3c]/30 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    {match.status === 'IN_PROGRESS' ? 'Score' : 'View'}
                  </Link>
                  <Link href={`/analytics?matchId=${match.id}`}
                    className="text-xs bg-[#1c2330] hover:bg-[#252d3d] text-gray-300 border border-[#30363d] px-3 py-1.5 rounded-lg transition-colors font-medium">
                    📊 Stats
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default withAuth(DashboardPage);
