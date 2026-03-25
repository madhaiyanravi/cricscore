'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { matchesApi, publicScoreApi } from '@/lib/api';
import { MatchSummary } from '@/types';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/providers/ToastProvider';

function SummaryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = Number(params.id);
  const token = searchParams.get('t') || '';
  const { toast } = useToast();

  const [summary, setSummary] = useState<MatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [momId, setMomId] = useState<number | ''>('');

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = token
        ? await publicScoreApi.getSummary(matchId, token)
        : await matchesApi.getSummary(matchId);
      setSummary(data);
      if (data?.match?.manOfTheMatchPlayerId) setMomId(data.match.manOfTheMatchPlayerId);
    } catch (e: any) {
      toast(e.response?.status === 401 ? 'Invalid or expired link' : 'Failed to load summary', 'error');
    } finally {
      setLoading(false);
    }
  }, [matchId, token, toast]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const allPlayers = useMemo(() => {
    const map = new Map<number, string>();
    (summary?.innings || []).forEach((inn) => {
      inn.battingCard?.forEach((b) => map.set(b.playerId, b.name));
      inn.bowlingCard?.forEach((b) => map.set(b.playerId, b.name));
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ label: name, value: id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [summary]);

  const setMom = async () => {
    if (!momId) return;
    setSaving(true);
    try {
      await matchesApi.setMom(matchId, Number(momId));
      toast('Man of the Match updated!', 'success');
      await fetchSummary();
    } catch {
      toast('Failed to set MOM', 'error');
    } finally {
      setSaving(false);
    }
  };

  const autoMom = async () => {
    setSaving(true);
    try {
      await matchesApi.autoMom(matchId);
      toast('MOM automatically selected based on performance points.', 'success');
      await fetchSummary();
    } catch {
      toast('Failed to auto-pick MOM', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
           <p className="text-muted animate-pulse text-lg font-medium">Crunching match data...</p>
        </main>
      </div>
    );
  }

  if (!summary) return null;

  const match = summary.match;

  return (
    <div className="min-h-screen bg-background text-text transition-colors duration-200">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {match.teamAName} <span className="text-muted/40 mx-2">vs</span> {match.teamBName}
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant={match.status === 'COMPLETED' ? 'success' : 'warning'}>
                 {match.status === 'COMPLETED' ? 'Match Finished' : 'In Progress'}
              </Badge>
              {match.resultText && (
                <p className="text-primary font-bold tracking-wide uppercase text-sm">{match.resultText}</p>
              )}
            </div>
          </div>
          <Link href={`/match/${matchId}`}>
             <Button variant="outline" size="sm">
               Back to Scoring Console
             </Button>
          </Link>
        </div>

        {/* Man Of The Match Section */}
        <Card className="p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 text-primary/5 select-none pointer-events-none">
             <span className="text-9xl font-black">MOM</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-black shadow-inner">
                   🏆
                </div>
                <div>
                   <h2 className="text-2xl font-bold">Man of the Match</h2>
                   <p className="text-muted font-medium">Top performer recognition</p>
                </div>
              </div>

              <div className="space-y-4">
                <Select
                   label="Awarded To"
                   value={momId}
                   onChange={(e) => setMomId(e.target.value ? Number(e.target.value) : '')}
                   disabled={token.length > 0 || saving}
                   options={[{ label: 'Select a player...', value: '' }, ...allPlayers]}
                />
                {!token && (
                  <div className="flex gap-2">
                    <Button onClick={setMom} isLoading={saving} disabled={!momId} className="flex-1">
                      Save Award
                    </Button>
                    <Button variant="secondary" onClick={autoMom} disabled={saving} className="px-6">
                       Auto-Suggest
                    </Button>
                  </div>
                )}
                {token && <p className="text-sm text-center text-muted italic">ReadOnly link enabled.</p>}
              </div>
            </div>

            <div className="w-full md:w-80">
               <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-4 px-2">Performance Leaders</h3>
               <div className="space-y-3">
                 {summary.momCandidates?.slice(0, 3).map((c, i) => (
                   <div 
                     key={c.playerId} 
                     className={cn(
                       "p-3 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer",
                       momId === c.playerId ? "bg-primary text-white border-primary shadow-lg scale-105" : "bg-muted/5 border-border/50 hover:bg-muted/10"
                     )}
                     onClick={() => !token && setMomId(c.playerId)}
                   >
                     <div className="flex items-center gap-3">
                        <span className={cn("text-lg font-black w-5", momId === c.playerId ? "text-white" : "text-muted/30")}>#{i+1}</span>
                        <div>
                           <p className="font-bold text-sm">{c.name}</p>
                           <p className={cn("text-[10px] font-black uppercase", momId === c.playerId ? "text-white/70" : "text-muted")}>
                             {c.runs} Runs · {c.wickets} Wkts
                           </p>
                        </div>
                     </div>
                     <div className={cn("text-xs font-black", momId === c.playerId ? "text-white" : "text-primary")}>
                       {c.points.toFixed(1)} <span className="text-[8px] opacity-60">PTS</span>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </Card>

        {/* Innings Details */}
        <div className="space-y-8">
           <h2 className="text-3xl font-bold tracking-tight border-b border-border pb-4">Full Scorecard</h2>
           {(summary.innings || []).map((inn) => (
             <div key={inn.inningsNumber} className="space-y-6">
                <Card className="p-0 overflow-hidden">
                   <div className="bg-muted/10 px-6 py-4 flex items-center justify-between border-b border-border">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center font-black text-primary">
                            {inn.inningsNumber}
                         </div>
                         <h3 className="text-xl font-bold">{inn.battingTeamName} <span className="text-muted font-normal">Batting</span></h3>
                      </div>
                      <div className="text-right">
                         <div className="text-2xl font-black text-primary">{inn.runs}/{inn.wickets}</div>
                         <div className="text-xs font-bold text-muted uppercase tracking-widest leading-none mt-1">
                            {inn.overs} OVERS · ERR {((inn.runs / (parseFloat(inn.overs.split('.')[0]) + (parseFloat(inn.overs.split('.')[1] || '0')/6))) || 0).toFixed(2)}
                         </div>
                      </div>
                   </div>

                   <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* Batting Card */}
                         <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted border-l-2 border-primary pl-3">Batting Breakdown</h4>
                            <div className="space-y-2">
                               {inn.battingCard.map(b => (
                                 <div key={b.playerId} className="flex items-center justify-between p-3 rounded-xl bg-muted/5 border border-border/10 hover:border-primary/30 transition-all">
                                    <div className="min-w-0">
                                       <p className="font-bold text-sm truncate">
                                          {b.name} {!b.out && <Badge variant="success" className="ml-2 py-0 px-1 text-[8px]">NOT OUT</Badge>}
                                       </p>
                                       {b.out && b.dismissal && <p className="text-[10px] text-muted italic truncate mt-0.5">{b.dismissal}</p>}
                                    </div>
                                    <div className="text-right shrink-0">
                                       <p className="text-sm font-black text-primary">{b.runs} <span className="text-xs font-medium text-muted">({b.balls})</span></p>
                                       <p className="text-[10px] text-muted font-bold mt-0.5">SR {(b.runs/(b.balls||1)*100).toFixed(1)}</p>
                                    </div>
                                 </div>
                               ))}
                            </div>
                            
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                               <span className="text-xs font-black uppercase tracking-widest text-primary">Extras</span>
                               <div className="flex gap-4">
                                  {Object.entries(inn.extrasBreakdown || {}).map(([type, count]) => (
                                     <div key={type} className="text-center">
                                        <p className="text-[10px] font-black text-primary">{count}</p>
                                        <p className="text-[8px] text-muted font-bold uppercase">{type.charAt(0)}</p>
                                     </div>
                                  ))}
                                  <div className="text-center border-l border-primary/20 pl-4 ml-2">
                                     <p className="text-sm font-black text-primary underline">{inn.extrasTotal}</p>
                                     <p className="text-[8px] text-muted font-bold uppercase">TOTAL</p>
                                  </div>
                               </div>
                            </div>
                         </div>

                         {/* Bowling Card */}
                         <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted border-l-2 border-success pl-3">Bowling Performance</h4>
                            <div className="space-y-2">
                               {inn.bowlingCard.map(b => (
                                 <div key={b.playerId} className="flex items-center justify-between p-3 rounded-xl bg-muted/5 border border-border/10 hover:border-success/30 transition-all">
                                    <div className="min-w-0">
                                       <p className="font-bold text-sm truncate">{b.name}</p>
                                       <p className="text-[10px] text-muted font-bold mt-0.5 uppercase tracking-widest">{b.overs}O · {b.maidens}M · {b.economy.toFixed(2)}E</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-xl font-black text-success">{b.wickets}<span className="text-muted text-xs mx-1 font-bold">/</span>{b.runs}</p>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>

                      {/* Fall of Wickets */}
                      <div className="mt-8 space-y-4">
                         <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted border-l-2 border-danger pl-3">Fall of Wickets</h4>
                         <div className="flex flex-wrap gap-3">
                             {inn.fallOfWickets.length === 0 ? (
                               <p className="text-xs text-muted italic">No wickets fallen in this innings.</p>
                             ) : (
                               inn.fallOfWickets.map(w => (
                                 <div key={w.wicketNumber} className="py-2 px-3 rounded-xl bg-danger/5 border border-danger/20 flex flex-col items-center min-w-[100px]">
                                    <span className="text-[10px] font-black text-danger uppercase opacity-60">Wicket {w.wicketNumber}</span>
                                    <span className="text-base font-black text-danger">{w.score}</span>
                                    <span className="text-[10px] font-bold text-muted underline">@{w.overs} Ov</span>
                                 </div>
                               ))
                             )}
                         </div>
                      </div>
                   </div>
                </Card>
             </div>
           ))}
        </div>
      </main>
    </div>
  );
}

export default withAuth(SummaryPage);

