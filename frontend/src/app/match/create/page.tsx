import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { teamsApi, matchesApi } from '@/lib/api';
import { Team } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

const OVERS_OPTIONS = [5, 10, 15, 20];

function CreateMatchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [totalOvers, setTotalOvers] = useState(10);
  const [tossWinnerTeamId, setTossWinnerTeamId] = useState('');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL'>('BAT');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    teamsApi.getAll().then(({ data }) => setTeams(data));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamAId === teamBId) {
      toast('Team A and Team B must be different.', 'error');
      return;
    }
    if (tossWinnerTeamId && tossWinnerTeamId !== teamAId && tossWinnerTeamId !== teamBId) {
      toast('Toss winner must be Team A or Team B.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data } = await matchesApi.create({
        teamAId: Number(teamAId),
        teamBId: Number(teamBId),
        totalOvers,
        tossWinnerTeamId: tossWinnerTeamId ? Number(tossWinnerTeamId) : null,
        tossDecision: tossWinnerTeamId ? tossDecision : null,
      });
      toast('Match created successfully!', 'success');
      router.push(`/match/${data.id}`);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to create match', 'error');
    } finally {
      setLoading(false);
    }
  };

  const teamA = teams.find(t => String(t.id) === teamAId);
  const teamB = teams.find(t => String(t.id) === teamBId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12 space-y-10">
        <div className="border-b border-border/50 pb-8">
          <h1 className="font-display text-5xl font-black text-text tracking-tighter">New Match</h1>
          <p className="text-muted text-sm font-bold mt-1 uppercase tracking-widest">Set up a new cricket match</p>
        </div>

        {teams.length < 2 && (
          <div className="bg-warning/10 border border-warning/30 text-warning px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-pulse">
            <span className="text-xl">⚠️</span>
            <span>You need at least 2 teams to create a match. <a href="/teams" className="underline hover:text-text ml-2">Add teams →</a></span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-8">
          {/* Team selection */}
          <Card className="p-8 space-y-8 bg-muted/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
            <h2 className="font-display text-xl font-black text-text uppercase tracking-widest">Select Teams</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Select
                label="Team A"
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
                options={[
                  { label: 'Choose team…', value: '' },
                  ...teams.map(t => ({ label: t.name, value: String(t.id) }))
                ]}
                required
              />
              <Select
                label="Team B"
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
                options={[
                  { label: 'Choose team…', value: '' },
                  ...teams.map(t => ({ label: t.name, value: String(t.id) }))
                ]}
                required
              />
            </div>

            {/* VS display */}
            {teamA && teamB && (
              <div className="flex items-center justify-center gap-6 py-6 bg-background rounded-2xl border-2 border-border/50 shadow-inner group transition-all hover:border-primary/30">
                <span className="font-display text-2xl font-black text-text group-hover:text-primary transition-colors">{teamA.name}</span>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs ring-4 ring-primary/5">VS</div>
                <span className="font-display text-2xl font-black text-text group-hover:text-primary transition-colors">{teamB.name}</span>
              </div>
            )}
          </Card>

          {/* Overs */}
          <Card className="p-8 space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="font-display text-xl font-black text-text uppercase tracking-widest">Match Overs</h2>
               <div className="px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">
                  {totalOvers * 6} BALLS
               </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {OVERS_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setTotalOvers(o)}
                  className={cn(
                    "py-5 rounded-2xl border-2 font-display text-2xl font-black transition-all duration-300 transform active:scale-95",
                    totalOvers === o
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 -translate-y-1"
                      : "bg-muted/5 border-border/50 text-muted hover:border-primary/30 hover:text-text"
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </Card>

          {/* Toss */}
          {teamA && teamB && (
            <Card className="p-8 space-y-8 bg-muted/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-warning" />
              <h2 className="font-display text-xl font-black text-text uppercase tracking-widest">Toss details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Select
                  label="Toss Winner"
                  value={tossWinnerTeamId}
                  onChange={(e) => setTossWinnerTeamId(e.target.value)}
                  options={[
                    { label: 'Skip (default Team A bats)', value: '' },
                    { label: teamA.name, value: String(teamA.id) },
                    { label: teamB.name, value: String(teamB.id) }
                  ]}
                />
                <div className="space-y-3">
                  <label className="block text-[10px] text-muted font-black uppercase tracking-[0.2em] ml-1">
                    Decision
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['BAT', 'BOWL'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setTossDecision(d)}
                        disabled={!tossWinnerTeamId}
                        className={cn(
                           "py-3.5 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30",
                           tossDecision === d
                             ? "bg-warning border-warning text-background shadow-lg shadow-warning/10"
                             : "bg-background border-border/50 text-muted hover:border-warning/30 hover:text-text"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Button
            type="submit"
            isLoading={loading}
            disabled={teams.length < 2}
            className="w-full py-6 text-xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/20"
          >
            Start Match ⚡
          </Button>
        </form>
      </main>
    </div>
  );
}

export default withAuth(CreateMatchPage);
