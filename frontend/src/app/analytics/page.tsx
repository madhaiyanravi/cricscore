'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { matchesApi, analyticsApi } from '@/lib/api';
import { Match, MatchAnalytics } from '@/types';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts';

const COLORS = ['#1a7a3c','#2aad56','#f59e0b','#ef4444','#6366f1','#06b6d4','#8b5cf6','#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

function AnalyticsPage() {
  const searchParams    = useSearchParams();
  const initialMatchId  = searchParams.get('matchId');

  const [matches, setMatches]       = useState<Match[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialMatchId ?? '');
  const [data, setData]             = useState<MatchAnalytics | null>(null);
  const [loading, setLoading]       = useState(false);
  const [matchLoading, setMatchLoading] = useState(true);

  useEffect(() => {
    matchesApi.getAll()
      .then(({ data }) => setMatches(data))
      .finally(() => setMatchLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    analyticsApi.getMatch(Number(selectedId))
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [selectedId]);

  // Prepare pie data for breakdown
  const breakdownData = data
    ? Object.entries(data.runsBreakdown)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: k, value: v }))
    : [];

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 pb-12">

        {/* Header + selector */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">Deep-dive match statistics</p>
          </div>
          <div className="w-full sm:w-72">
            <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Select Match</label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="input"
            >
              <option value="">Choose a match…</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.teamAName} vs {m.teamBName} ({m.totalOvers} ov)
                </option>
              ))}
            </select>
          </div>
        </div>

        {!selectedId && !matchLoading && (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-gray-400">Select a match above to see analytics</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-gray-500 animate-pulse">Crunching numbers…</div>
        )}

        {data && !loading && (
          <>
            {/* Match summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Runs',    value: data.totalRuns,    color: 'text-[#2aad56]' },
                { label: 'Wickets',       value: data.totalWickets, color: 'text-red-400'   },
                { label: 'Fours',         value: data.totalFours,   color: 'text-blue-400'  },
                { label: 'Sixes',         value: data.totalSixes,   color: 'text-purple-400'},
              ].map(s => (
                <div key={s.label} className="card p-4 text-center">
                  <div className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Second row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Dot Balls',    value: data.dotBalls,    color: 'text-gray-400' },
                { label: 'Extras',       value: data.totalExtras, color: 'text-amber-400'},
                { label: 'Top Scorer',   value: data.topScorerName   ? `${data.topScorerName} (${data.topScorerRuns})` : '—',   color: 'text-[#2aad56]' },
                { label: 'Top Bowler',   value: data.topBowlerName   ? `${data.topBowlerName} (${data.topBowlerWickets}W)` : '—', color: 'text-red-400'   },
              ].map(s => (
                <div key={s.label} className="card p-4 text-center">
                  <div className={`font-display text-lg font-bold ${s.color} truncate`}>{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Over-by-over bar chart */}
            {data.overByOver.length > 0 && (
              <div className="card p-5">
                <h2 className="font-display text-xl font-semibold text-white mb-4">Runs Per Over</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.overByOver} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis dataKey="over" tick={{ fill: '#8b949e', fontSize: 11 }} label={{ value: 'Over', position: 'insideBottom', fill: '#8b949e', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="runs" name="Runs" radius={[4, 4, 0, 0]}>
                      {data.overByOver.map((entry, i) => (
                        <Cell key={i} fill={entry.wickets > 0 ? '#ef4444' : '#1a7a3c'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded-sm bg-[#1a7a3c] inline-block"/>Normal over</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block"/>Wicket in over</span>
                </p>
              </div>
            )}

            {/* Run-rate progression line chart */}
            {data.overByOver.length > 1 && (
              <div className="card p-5">
                <h2 className="font-display text-xl font-semibold text-white mb-4">Run Rate Progression</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.overByOver} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis dataKey="over" tick={{ fill: '#8b949e', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="runRate"
                      name="Run Rate"
                      stroke="#2aad56"
                      strokeWidth={2}
                      dot={{ fill: '#2aad56', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Runs breakdown pie */}
            {breakdownData.length > 0 && (
              <div className="card p-5">
                <h2 className="font-display text-xl font-semibold text-white mb-4">Scoring Breakdown</h2>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={breakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {breakdownData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        formatter={(v) => <span style={{ color: '#8b949e', fontSize: 12 }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Breakdown table */}
                <div className="mt-4 space-y-2">
                  {breakdownData.map(({ name, value }, i) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-300 flex-1">{name}</span>
                      <div className="flex-1 bg-[#0d1117] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            background: COLORS[i % COLORS.length],
                            width: `${(value / Math.max(...breakdownData.map(d => d.value))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white w-8 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Over details table */}
            {data.overByOver.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-[#30363d]">
                  <h2 className="font-display text-xl font-semibold text-white">Over-by-Over Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#30363d]">
                        {['Over', 'Runs', 'Wickets', 'Run Rate'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.overByOver.map((ov, i) => (
                        <tr key={ov.over} className={`border-b border-[#30363d] last:border-0 ${i % 2 === 0 ? '' : 'bg-[#0d1117]/50'}`}>
                          <td className="px-4 py-3 font-display text-lg font-bold text-white">{ov.over}</td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${ov.runs >= 10 ? 'text-[#2aad56]' : ov.runs <= 3 ? 'text-gray-500' : 'text-white'}`}>
                              {ov.runs}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {ov.wickets > 0
                              ? <span className="text-red-400 font-bold">{ov.wickets}W</span>
                              : <span className="text-gray-600">—</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-gray-300">{ov.runRate.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default withAuth(AnalyticsPage);
