import React, { useEffect, useState, Suspense } from 'react';
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
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const COLORS = ['#1a7a3c','#2aad56','#f59e0b','#ef4444','#6366f1','#06b6d4','#8b5cf6','#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-xl px-4 py-3 text-xs shadow-2xl ring-1 ring-white/5">
      <p className="text-muted mb-2 font-black uppercase tracking-wider">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-black flex justify-between gap-4">
          <span className="opacity-70">{p.name}:</span> 
          <span>{p.value}</span>
        </p>
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
        <div className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between border-b border-border/50 pb-8 mt-4">
          <div>
            <h1 className="font-display text-5xl font-black text-text tracking-tighter">Analytics</h1>
            <p className="text-muted text-sm font-bold mt-1 uppercase tracking-widest leading-none">Deep-dive match statistics</p>
          </div>
          <div className="w-full sm:w-72">
            <Select
              label="Select Match"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              options={[
                { label: 'Choose a match…', value: '' },
                ...matches.map(m => ({
                  label: `${m.teamAName} vs ${m.teamBName} (${m.totalOvers} ov)`,
                  value: String(m.id)
                }))
              ]}
            />
          </div>
        </div>

        {!selectedId && !matchLoading && (
          <Card className="p-20 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-inner ring-1 ring-primary/20">📊</div>
            <p className="text-muted font-black uppercase tracking-[0.2em] text-xs">Select a match above to reveal the data</p>
          </Card>
        )}

        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        )}

        {data && !loading && (
          <>
            {/* Match summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Runs',    value: data.totalRuns,    icon: '🔥', color: 'text-success' },
                { label: 'Wickets',       value: data.totalWickets, icon: '⚡', color: 'text-danger'  },
                { label: 'Fours',         value: data.totalFours,   icon: '🏏', color: 'text-accent'  },
                { label: 'Sixes',         value: data.totalSixes,   icon: '🚀', color: 'text-primary' },
              ].map(s => (
                <Card key={s.label} className="p-6 text-center transform hover:scale-105 transition-all duration-300 ring-1 ring-white/5 border-b-4 border-b-border hover:border-b-primary shadow-xl">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 flex items-center justify-center gap-1.5 opacity-60">
                     <span>{s.icon}</span> {s.label}
                  </div>
                  <div className={cn("font-display text-4xl font-black", s.color)}>{s.value}</div>
                </Card>
              ))}
            </div>

            {/* Second row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Dot Balls',    value: data.dotBalls,    color: 'text-muted' },
                { label: 'Extras',       value: data.totalExtras, color: 'text-warning'},
                { label: 'Top Scorer',   value: data.topScorerName   ? `${data.topScorerName.split(' ')[0]} (${data.topScorerRuns})` : '—',   color: 'text-success' },
                { label: 'Top Bowler',   value: data.topBowlerName   ? `${data.topBowlerName.split(' ')[0]} (${data.topBowlerWickets}W)` : '—', color: 'text-danger'   },
              ].map(s => (
                <Card key={s.label} className="p-6 text-center border border-border/50 shadow-lg bg-muted/5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">{s.label}</div>
                  <div className={cn("font-display text-lg font-black truncate", s.color)}>{s.value}</div>
                </Card>
              ))}
            </div>

            {/* Over-by-over bar chart */}
            {data.overByOver.length > 0 && (
              <Card className="p-8">
                <div className="flex items-center gap-2 mb-8">
                   <div className="w-1.5 h-6 bg-primary rounded-full" />
                   <h2 className="font-display text-xl font-black text-text uppercase tracking-widest">Runs Per Over</h2>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.overByOver} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                    <XAxis 
                       dataKey="over" 
                       tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 900 }} 
                       axisLine={false}
                       tickLine={false}
                       label={{ value: 'OVER', position: 'insideBottom', offset: -10, fill: 'currentColor', fontSize: 9, fontWeight: 900, opacity: 0.5 }} 
                    />
                    <YAxis 
                       tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 900 }} 
                       axisLine={false}
                       tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128,128,128,0.05)' }} />
                    <Bar dataKey="runs" name="Runs" radius={[6, 6, 0, 0]} barSize={24}>
                      {data.overByOver.map((entry, i) => (
                        <Cell key={i} fill={entry.wickets > 0 ? '#ef4444' : '#2aad56'} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-6 border-t border-border/50 pt-6">
                   <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
                      <span className="w-3 h-3 rounded-sm bg-success/80"/> Normal
                   </span>
                   <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
                      <span className="w-3 h-3 rounded-sm bg-danger/80"/> Wicket
                   </span>
                </div>
              </Card>
            )}

            {/* Run-rate progression line chart */}
            {data.overByOver.length > 1 && (
              <Card className="p-8">
                <div className="flex items-center gap-2 mb-8">
                   <div className="w-1.5 h-6 bg-accent rounded-full" />
                   <h2 className="font-display text-xl font-black text-text uppercase tracking-widest">Run Rate Progression</h2>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.overByOver} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                    <XAxis 
                       dataKey="over" 
                       tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 900 }} 
                       axisLine={false}
                       tickLine={false}
                    />
                    <YAxis 
                       tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 900 }} 
                       axisLine={false}
                       tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="runRate"
                      name="Run Rate"
                      stroke="#2aad56"
                      strokeWidth={4}
                      dot={{ fill: '#2aad56', r: 4, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Runs breakdown pie */}
            {breakdownData.length > 0 && (
              <Card className="p-8">
                <div className="flex items-center gap-2 mb-8">
                   <div className="w-1.5 h-6 bg-primary rounded-full" />
                   <h2 className="font-display text-xl font-black text-text uppercase tracking-widest">Scoring Breakdown</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={breakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {breakdownData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Breakdown details */}
                  <div className="space-y-4">
                    {breakdownData.map(({ name, value }, i) => (
                      <div key={name} className="flex items-center gap-4 group">
                        <span className="w-10 text-[10px] font-black uppercase text-muted tracking-tight">{name}</span>
                        <div className="flex-1 bg-muted/5 rounded-full h-3 overflow-hidden border border-border/30">
                          <div
                            className="h-full rounded-full transition-all duration-500 shadow-lg"
                            style={{
                              background: COLORS[i % COLORS.length],
                              width: `${(value / Math.max(...breakdownData.map(d => d.value))) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-black text-text w-6 text-right group-hover:text-primary transition-colors">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Over details table */}
            {data.overByOver.length > 0 && (
              <Card className="overflow-hidden border border-border/50">
                <div className="p-6 border-b border-border/50 flex items-center gap-2">
                   <div className="w-1.5 h-6 bg-success rounded-full" />
                   <h2 className="font-display text-xl font-black text-text uppercase tracking-widest">Innings Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/5 border-b border-border/50">
                        {['Over', 'Runs', 'Wickets', 'Run Rate'].map(h => (
                          <th key={h} className="px-6 py-4 text-left text-[10px] text-muted uppercase tracking-[0.2em] font-black">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {data.overByOver.sort((a,b) => b.over - a.over).map((ov, i) => (
                        <tr key={ov.over} className="hover:bg-muted/5 transition-colors group">
                          <td className="px-6 py-5">
                             <div className="w-10 h-10 rounded-2xl bg-muted/5 border border-border/50 flex items-center justify-center font-black text-lg text-text group-hover:border-primary group-hover:text-primary transition-all">
                                {ov.over}
                             </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={cn(
                               "px-3 py-1 rounded-full text-xs font-black",
                               ov.runs >= 12 ? "bg-success/10 text-success border border-success/20" : 
                               ov.runs >= 8 ? "bg-primary/10 text-primary border border-primary/20" :
                               ov.runs <= 3 ? "bg-muted/10 text-muted opacity-50 border border-border/50" :
                               "bg-muted/5 text-text border border-border/30"
                            )}>
                              {ov.runs} RUNS
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            {ov.wickets > 0
                              ? <Badge variant="danger" className="px-3 py-1 font-black">{ov.wickets} WICKET{ov.wickets > 1 ? 'S' : ''}</Badge>
                              : <span className="text-[10px] text-muted/30 font-black uppercase tracking-widest">—</span>
                            }
                          </td>
                          <td className="px-6 py-5 text-muted font-bold tracking-tight">{ov.runRate.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default withAuth(AnalyticsPage);
