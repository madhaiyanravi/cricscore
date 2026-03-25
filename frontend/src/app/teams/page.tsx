'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { teamsApi } from '@/lib/api';
import { Team } from '@/types';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/providers/ToastProvider';

const ROLES = [
  { label: 'BATSMAN', value: 'BATSMAN' },
  { label: 'BOWLER', value: 'BOWLER' },
  { label: 'ALL ROUNDER', value: 'ALL_ROUNDER' },
  { label: 'WICKET KEEPER', value: 'WICKET_KEEPER' },
];

const BATTING_STYLES = [
  { label: 'RIGHT HAND', value: 'RIGHT_HAND' },
  { label: 'LEFT HAND', value: 'LEFT_HAND' },
];

const BOWLING_STYLES = [
  { label: 'FAST', value: 'FAST' },
  { label: 'MEDIUM', value: 'MEDIUM' },
  { label: 'SPIN', value: 'SPIN' },
];

function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '', teamId: '', role: '', battingStyle: '', bowlingStyle: '', jerseyNumber: '',
  });

  const fetchTeams = () => {
    setFetching(true);
    teamsApi.getAll()
      .then(({ data }) => setTeams(data))
      .catch(() => toast('Failed to fetch teams', 'error'))
      .finally(() => setFetching(false));
  };

  useEffect(() => { fetchTeams(); }, []);

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setLoading(true);
    try {
      await teamsApi.create(newTeamName.trim());
      setNewTeamName('');
      toast('Team created successfully!', 'success');
      fetchTeams();
    } catch {
      toast('Failed to create team', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.teamId) return;
    setLoading(true);
    try {
      await teamsApi.addPlayer(form.name.trim(), Number(form.teamId));
      setForm({ name: '', teamId: '', role: '', battingStyle: '', bowlingStyle: '', jerseyNumber: '' });
      toast('Player added successfully!', 'success');
      fetchTeams();
    } catch {
      toast('Failed to add player', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sel = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-background text-text transition-colors duration-200">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Teams & Rosters</h1>
          <p className="text-muted text-lg mt-2">Create teams and manage player squads.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Create team */}
          <Card className="p-6 h-fit lg:col-span-1">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               <span className="p-2 bg-primary/10 rounded-lg text-primary">🏆</span>
               Create Team
            </h2>
            <form onSubmit={createTeam} className="space-y-4">
              <Input
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="Ex: Mumbai Indians"
                label="Team Name"
                required
              />
              <Button type="submit" isLoading={loading} className="w-full">
                Create Team
              </Button>
            </form>
          </Card>

          {/* Add player */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               <span className="p-2 bg-primary/10 rounded-lg text-primary">👤</span>
               Add Player to Roster
            </h2>
            <form onSubmit={addPlayer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={form.teamId}
                onChange={sel('teamId')}
                label="Select Team"
                required
                options={[{ label: 'Choose a team...', value: '' }, ...teams.map(t => ({ label: t.name, value: t.id }))]}
              />
              <Input
                value={form.name}
                onChange={sel('name')}
                label="Player Full Name"
                placeholder="Ex: Virat Kohli"
                required
              />
              <div className="space-y-4">
                <Select
                  value={form.role}
                  onChange={sel('role')}
                  label="Role"
                  options={[{ label: 'Select role...', value: '' }, ...ROLES]}
                />
                <Input
                  value={form.jerseyNumber}
                  onChange={sel('jerseyNumber')}
                  label="Jersey Number"
                  type="number"
                  placeholder="Ex: 18"
                />
              </div>
              <div className="space-y-4">
                <Select
                  value={form.battingStyle}
                  onChange={sel('battingStyle')}
                  label="Batting Style"
                  options={[{ label: 'Select style...', value: '' }, ...BATTING_STYLES]}
                />
                <Select
                  value={form.bowlingStyle}
                  onChange={sel('bowlingStyle')}
                  label="Bowling Style"
                  options={[{ label: 'Select style...', value: '' }, ...BOWLING_STYLES]}
                />
              </div>
              <div className="md:col-span-2 mt-2">
                <Button type="submit" isLoading={loading} disabled={!form.teamId} className="w-full">
                  Add Player to Team
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Teams list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Active Teams</h2>
            <div className="text-sm font-medium text-muted">
              {teams.length} teams registered
            </div>
          </div>

          {fetching ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : teams.length === 0 ? (
            <Card variant="glass" className="py-16 text-center text-muted">
              No teams created yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {teams.map(team => (
                <Card key={team.id} className="p-0 overflow-hidden group">
                  <button
                    onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                    className={cn(
                      "w-full p-5 flex items-center justify-between transition-colors text-left",
                      expandedTeam === team.id ? "bg-primary/5" : "hover:bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl group-hover:scale-110 transition-transform">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-lg font-bold group-hover:text-primary transition-colors">{team.name}</div>
                        <div className="text-sm text-muted font-medium">{team.players.length} players in squad</div>
                      </div>
                    </div>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center bg-muted/10 transition-transform duration-300",
                      expandedTeam === team.id && "rotate-180 bg-primary/20 text-primary"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </button>

                  {expandedTeam === team.id && (
                    <div className="border-t border-border p-6 bg-muted/5 animate-in slide-in-from-top-2 duration-200">
                      {team.players.length === 0 ? (
                        <div className="text-center py-4 bg-background/50 rounded-lg border border-dashed border-border">
                          <p className="text-muted text-sm font-medium">No players found in this squad.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {team.players.map(p => (
                            <Link key={p.id} href={`/players/${p.id}`}>
                              <Card className="p-3 flex items-center gap-3 hover:border-primary/50 hover:shadow-sm transition-all bg-background">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                                  {p.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold truncate">{p.name}</p>
                                  {p.role && <p className="text-[10px] text-muted font-bold uppercase tracking-wider">{p.role.replace('_', ' ')}</p>}
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-muted"><path d="m9 18 6-6-6-6"/></svg>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default withAuth(TeamsPage);
