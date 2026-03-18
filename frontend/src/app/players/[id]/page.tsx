'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { playersApi } from '@/lib/api';
import { PlayerProfile } from '@/types';

const BATTING_STYLES = ['RIGHT_HAND', 'LEFT_HAND'];
const BOWLING_STYLES = ['FAST', 'MEDIUM', 'SPIN'];
const ROLES          = ['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'];

function StatCard({ label, value, sub, color = 'text-white' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="card p-4 text-center">
      <div className={`font-display text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1 font-medium">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function PlayerDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const playerId = Number(params.id);

  const [player, setPlayer]     = useState<PlayerProfile | null>(null);
  const [editing, setEditing]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState<Partial<PlayerProfile>>({});

  useEffect(() => {
    playersApi.getOne(playerId)
      .then(({ data }) => { setPlayer(data); setForm(data); })
      .finally(() => setLoading(false));
  }, [playerId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await playersApi.update(playerId, form as Record<string, unknown>);
      setPlayer(data);
      setForm(data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof PlayerProfile, label: string, type: 'text' | 'textarea' | 'number' = 'text') => (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={(form[key] as string) ?? ''}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="input resize-none h-20"
          placeholder={`Enter ${label.toLowerCase()}…`}
        />
      ) : (
        <input
          type={type}
          value={(form[key] as string | number) ?? ''}
          onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          className="input"
          placeholder={`Enter ${label.toLowerCase()}…`}
        />
      )}
    </div>
  );

  const selectField = (key: keyof PlayerProfile, label: string, options: string[]) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">{label}</label>
      <select
        value={(form[key] as string) ?? ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value || undefined }))}
        className="input"
      >
        <option value="">Not set</option>
        {options.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
      </select>
    </div>
  );

  if (loading) return (
    <><Navbar /><div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-500 animate-pulse">Loading player…</p>
    </div></>
  );

  if (!player) return (
    <><Navbar /><div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-red-400">Player not found</p>
    </div></>
  );

  const sr   = player.strikeRate?.toFixed(1)   ?? '—';
  const avg  = player.battingAverage?.toFixed(1) ?? '—';
  const econ = player.economyRate?.toFixed(2)  ?? '—';
  const bowl = player.bowlingAverage?.toFixed(1) ?? '—';

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Profile header */}
        <div className="card p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-[#1a7a3c]/20 flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#30363d]">
              {player.avatarUrl
                ? <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                : <span className="font-display text-4xl font-bold text-[#2aad56]">{player.name.charAt(0)}</span>
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="font-display text-3xl font-bold text-white">{player.name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {player.jerseyNumber && (
                      <span className="text-xs text-gray-400 bg-[#0d1117] px-2 py-0.5 rounded font-mono">#{player.jerseyNumber}</span>
                    )}
                    {player.role && (
                      <span className="text-xs text-[#2aad56] bg-[#1a7a3c]/20 border border-[#1a7a3c]/40 px-2 py-0.5 rounded font-medium">
                        {player.role.replace('_', ' ')}
                      </span>
                    )}
                    {player.battingStyle && (
                      <span className="text-xs text-gray-400">🏏 {player.battingStyle.replace('_', '-')}</span>
                    )}
                    {player.bowlingStyle && (
                      <span className="text-xs text-gray-400">🎳 {player.bowlingStyle}</span>
                    )}
                  </div>
                  {player.bio && <p className="text-sm text-gray-400 mt-2 leading-relaxed">{player.bio}</p>}
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0"
                >
                  {editing ? 'Cancel' : '✏️ Edit'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="card p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold text-white">Edit Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('name', 'Name')}
              {field('avatarUrl', 'Avatar URL')}
              {field('jerseyNumber', 'Jersey Number', 'number')}
              {selectField('role', 'Role', ROLES)}
              {selectField('battingStyle', 'Batting Style', BATTING_STYLES)}
              {selectField('bowlingStyle', 'Bowling Style', BOWLING_STYLES)}
            </div>
            {field('bio', 'Bio', 'textarea')}
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Batting stats */}
        <div>
          <h2 className="font-display text-xl font-semibold text-white mb-3 flex items-center gap-2">
            🏏 Batting
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Runs"     value={player.totalRuns}    color="text-[#2aad56]" />
            <StatCard label="Average"  value={avg}                 color="text-blue-400" />
            <StatCard label="Strike Rate" value={`${sr}`}          color="text-amber-400" />
            <StatCard label="Highest"  value={player.highestScore} color="text-purple-400" />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <StatCard label="4s"       value={player.totalFours}   color="text-blue-300" />
            <StatCard label="6s"       value={player.totalSixes}   color="text-purple-300" />
            <StatCard label="Balls"    value={player.totalBallsFaced} />
          </div>
        </div>

        {/* Bowling stats (only if bowler or all-rounder) */}
        {(player.totalWickets > 0 || player.role === 'BOWLER' || player.role === 'ALL_ROUNDER') && (
          <div>
            <h2 className="font-display text-xl font-semibold text-white mb-3 flex items-center gap-2">
              🎳 Bowling
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Wickets"  value={player.totalWickets} color="text-red-400" />
              <StatCard label="Average"  value={bowl}                color="text-orange-400" />
              <StatCard label="Economy"  value={econ}                color="text-amber-400" />
              <StatCard label="Matches"  value={player.totalMatches} />
            </div>
          </div>
        )}

        {/* Career overview */}
        <div className="card p-5">
          <h2 className="font-display text-lg font-semibold text-white mb-4">Career Overview</h2>
          <div className="space-y-3">
            {[
              { label: 'Total Matches',  value: player.totalMatches },
              { label: 'Total Runs',     value: player.totalRuns },
              { label: 'Total Wickets',  value: player.totalWickets },
              { label: 'Highest Score',  value: player.highestScore },
              { label: 'Batting Average', value: avg },
              { label: 'Strike Rate',    value: sr },
              { label: 'Economy Rate',   value: econ },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[#30363d] last:border-0">
                <span className="text-sm text-gray-400">{label}</span>
                <span className="text-sm font-semibold text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </>
  );
}

export default withAuth(PlayerDetailPage);
