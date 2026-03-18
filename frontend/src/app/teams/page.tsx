'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { teamsApi } from '@/lib/api';
import { Team } from '@/types';

const ROLES          = ['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'];
const BATTING_STYLES = ['RIGHT_HAND', 'LEFT_HAND'];
const BOWLING_STYLES = ['FAST', 'MEDIUM', 'SPIN'];

function TeamsPage() {
  const [teams, setTeams]               = useState<Team[]>([]);
  const [newTeamName, setNewTeamName]   = useState('');
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [loading, setLoading]           = useState(false);

  // Add player form state
  const [form, setForm] = useState({
    name: '', teamId: '', role: '', battingStyle: '', bowlingStyle: '', jerseyNumber: '',
  });

  const fetchTeams = () => teamsApi.getAll().then(({ data }) => setTeams(data));
  useEffect(() => { fetchTeams(); }, []);

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setLoading(true);
    try { await teamsApi.create(newTeamName.trim()); setNewTeamName(''); fetchTeams(); }
    finally { setLoading(false); }
  };

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.teamId) return;
    setLoading(true);
    try {
      await teamsApi.addPlayer(form.name.trim(), Number(form.teamId));
      setForm({ name: '', teamId: '', role: '', battingStyle: '', bowlingStyle: '', jerseyNumber: '' });
      fetchTeams();
    } finally { setLoading(false); }
  };

  const sel = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white">Teams</h1>
          <p className="text-gray-400 text-sm mt-1">Manage teams and player rosters</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create team */}
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Create Team</h2>
            <form onSubmit={createTeam} className="space-y-3">
              <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Team name…" className="input" required />
              <button type="submit" disabled={loading} className="btn-primary w-full">Create Team</button>
            </form>
          </div>

          {/* Add player */}
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Add Player</h2>
            <form onSubmit={addPlayer} className="space-y-3">
              <select value={form.teamId} onChange={sel('teamId')} className="input" required>
                <option value="">Select team…</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input value={form.name} onChange={sel('name')} placeholder="Player name…" className="input" required />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.role} onChange={sel('role')} className="input">
                  <option value="">Role…</option>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
                <input value={form.jerseyNumber} onChange={sel('jerseyNumber')} placeholder="Jersey #" type="number" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.battingStyle} onChange={sel('battingStyle')} className="input">
                  <option value="">Batting…</option>
                  {BATTING_STYLES.map(s => <option key={s} value={s}>{s.replace('_', '-')}</option>)}
                </select>
                <select value={form.bowlingStyle} onChange={sel('bowlingStyle')} className="input">
                  <option value="">Bowling…</option>
                  {BOWLING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading || !form.teamId} className="btn-primary w-full">Add Player</button>
            </form>
          </div>
        </div>

        {/* Teams list */}
        <div className="space-y-3">
          {teams.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">No teams yet.</div>
          ) : (
            teams.map(team => (
              <div key={team.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-[#1c2330] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1a7a3c]/20 flex items-center justify-center text-[#2aad56] font-display font-bold text-lg">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">{team.name}</div>
                      <div className="text-xs text-gray-500">{team.players.length} player{team.players.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <span className="text-gray-500 text-sm">{expandedTeam === team.id ? '▲' : '▼'}</span>
                </button>

                {expandedTeam === team.id && (
                  <div className="border-t border-[#30363d] px-4 py-3">
                    {team.players.length === 0 ? (
                      <p className="text-gray-500 text-sm py-2">No players yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {team.players.map(p => (
                          <Link key={p.id} href={`/players/${p.id}`}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1c2330] transition-colors group">
                            <span className="w-7 h-7 rounded-full bg-[#1a7a3c]/20 flex items-center justify-center text-xs font-bold text-[#2aad56]">
                              {p.name.charAt(0)}
                            </span>
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{p.name}</span>
                            <span className="text-gray-600 text-xs ml-auto group-hover:text-gray-400">→</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}

export default withAuth(TeamsPage);
