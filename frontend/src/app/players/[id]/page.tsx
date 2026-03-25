'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { playersApi } from '@/lib/api';
import { PlayerProfile } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

const BATTING_STYLES = ['RIGHT_HAND', 'LEFT_HAND'];
const BOWLING_STYLES = ['FAST', 'MEDIUM', 'SPIN'];
const ROLES = ['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'];

function StatCard({ label, value, sub, color = 'text-text' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card className="p-6 text-center group hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1 bg-muted/5">
      <div className={cn("font-display text-4xl font-black mb-1 group-hover:scale-110 transition-transform", color)}>{value}</div>
      <div className="text-[10px] text-muted font-black uppercase tracking-[0.2em]">{label}</div>
      {sub && <div className="text-[10px] text-muted/40 font-bold mt-1 italic">{sub}</div>}
    </Card>
  );
}

function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const playerId = Number(params.id);

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<PlayerProfile>>({});

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
      toast('Profile updated successfully!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background text-text">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
            <Skeleton className="h-40 rounded-3xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            <Skeleton className="h-64 rounded-3xl" />
        </main>
    </div>
  );

  if (!player) return (
    <div className="min-h-screen bg-background text-text">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center">
            <div className="text-6xl mb-6 opacity-20 text-text">🏜️</div>
            <h2 className="text-2xl font-black text-text uppercase tracking-widest">Player Not Found</h2>
            <Button variant="ghost" className="mt-6" onClick={() => router.back()}>← Go Back</Button>
        </main>
    </div>
  );

  const sr = player.strikeRate?.toFixed(1) ?? '—';
  const avg = player.battingAverage?.toFixed(1) ?? '—';
  const econ = player.economyRate?.toFixed(2) ?? '—';
  const bowl = player.bowlingAverage?.toFixed(1) ?? '—';

  return (
    <div className="min-h-screen bg-background text-text">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">

        {/* Profile header */}
        <Card className="p-8 bg-muted/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-primary/5 select-none font-black italic text-8xl transition-all group-hover:scale-110 group-hover:text-primary/10">PRO</div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-3xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-border/50 shadow-inner group-hover:border-primary/50 transition-all duration-500">
              {player.avatarUrl
                ? <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                : <span className="font-display text-5xl font-black text-primary">{player.name.charAt(0)}</span>
              }
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div>
                  <h1 className="font-display text-4xl sm:text-5xl font-black text-text tracking-tighter leading-none mb-4">{player.name}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-4">
                    {player.jerseyNumber && (
                      <Badge variant="outline" className="text-muted border-border/50 font-mono tracking-tighter">#{player.jerseyNumber}</Badge>
                    )}
                    {player.role && (
                      <Badge variant="primary" className="font-black uppercase tracking-widest px-3">
                        {player.role.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-4 text-[10px] font-black uppercase tracking-widest text-muted/60">
                    {player.battingStyle && (
                      <span className="flex items-center gap-1.5"><span className="text-base">🏏</span> {player.battingStyle.replace('_', '-')}</span>
                    )}
                    {player.bowlingStyle && (
                      <span className="flex items-center gap-1.5"><span className="text-base">🎳</span> {player.bowlingStyle}</span>
                    )}
                  </div>
                  {player.bio && <p className="text-sm text-muted mt-6 leading-relaxed italic border-l-2 border-border/30 pl-4">{player.bio}</p>}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(!editing)}
                  className="flex-shrink-0"
                >
                  {editing ? 'Cancel' : '✏️ Edit Profile'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Edit form */}
        {editing && (
          <Card className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-300">
            <h2 className="font-display text-2xl font-black text-text tracking-tighter border-b border-border/50 pb-4">Edit Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <Input
                label="Name"
                value={form.name ?? ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Enter player name"
              />
              <Input
                label="Avatar URL"
                value={form.avatarUrl ?? ''}
                onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
                placeholder="https://example.com/photo.jpg"
              />
              <Input
                label="Jersey Number"
                type="number"
                value={form.jerseyNumber ?? ''}
                onChange={e => setForm(f => ({ ...f, jerseyNumber: Number(e.target.value) }))}
                placeholder="e.g. 10"
              />
              <Select
                label="Role"
                value={form.role ?? ''}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
                options={[
                    { label: 'Not set', value: '' },
                    ...ROLES.map(r => ({ label: r.replace('_', ' '), value: r }))
                ]}
              />
              <Select
                label="Batting Style"
                value={form.battingStyle ?? ''}
                onChange={e => setForm(f => ({ ...f, battingStyle: e.target.value as any }))}
                options={[
                    { label: 'Not set', value: '' },
                    ...BATTING_STYLES.map(s => ({ label: s.replace('_', ' '), value: s }))
                ]}
              />
              <Select
                label="Bowling Style"
                value={form.bowlingStyle ?? ''}
                onChange={e => setForm(f => ({ ...f, bowlingStyle: e.target.value as any }))}
                options={[
                    { label: 'Not set', value: '' },
                    ...BOWLING_STYLES.map(s => ({ label: s.replace('_', ' '), value: s }))
                ]}
              />
            </div>
            <div className="space-y-3">
                <label className="block text-[10px] text-muted font-black uppercase tracking-[0.2em] ml-1">Bio</label>
                <textarea
                    value={form.bio ?? ''}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    className="input resize-none h-32"
                    placeholder="Tell us about this player..."
                />
            </div>
            <Button onClick={handleSave} isLoading={saving} className="w-full py-4 text-base tracking-widest">
              Save Profile Changes ⚡
            </Button>
          </Card>
        )}

        {/* Batting stats */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-primary rounded-full" />
             <h2 className="font-display text-2xl font-black text-text tracking-tighter uppercase">Batting Stats</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Runs"     value={player.totalRuns}    color="text-success" />
            <StatCard label="Average"  value={avg}                 color="text-accent" />
            <StatCard label="Strike Rate" value={`${sr}`}          color="text-warning" />
            <StatCard label="Highest"  value={player.highestScore} color="text-primary" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <StatCard label="Fours"       value={player.totalFours}   color="text-accent/80" />
            <StatCard label="Sixes"       value={player.totalSixes}   color="text-primary/80" />
            <StatCard label="Balls faced" value={player.totalBallsFaced} color="text-muted/60" />
          </div>
        </section>

        {/* Bowling stats (only if bowler or all-rounder) */}
        {(player.totalWickets > 0 || player.role === 'BOWLER' || player.role === 'ALL_ROUNDER') && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-danger rounded-full" />
               <h2 className="font-display text-2xl font-black text-text tracking-tighter uppercase">Bowling Stats</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Wickets"  value={player.totalWickets} color="text-danger" />
              <StatCard label="Average"  value={bowl}                color="text-warning" />
              <StatCard label="Economy"  value={econ}                color="text-primary" />
              <StatCard label="Matches"  value={player.totalMatches} />
            </div>
          </section>
        )}

        {/* Career overview */}
        <Card className="p-8 border border-border/50">
          <h2 className="font-display text-2xl font-black text-text tracking-tighter border-b border-border/30 pb-4 mb-6 uppercase">Career Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
            {[
              { label: 'Matches Played',  value: player.totalMatches },
              { label: 'Career Runs',     value: player.totalRuns },
              { label: 'Career Wickets',  value: player.totalWickets },
              { label: 'Highest Score',  value: player.highestScore },
              { label: 'Batting Average', value: avg },
              { label: 'Overall Strike Rate', value: sr },
              { label: 'Bowling Economy',   value: econ },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-border/20 last:border-0 group">
                <span className="text-xs text-muted font-black uppercase tracking-widest">{label}</span>
                <span className="text-sm font-black text-text group-hover:text-primary transition-colors">{value}</span>
              </div>
            ))}
          </div>
        </Card>

      </main>
    </div>
  );
}

export default withAuth(PlayerDetailPage);
