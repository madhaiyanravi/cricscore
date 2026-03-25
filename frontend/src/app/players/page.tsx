'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { playersApi } from '@/lib/api';
import { PlayerProfile } from '@/types';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';

const ROLE_ICONS: Record<string, string> = {
  BATSMAN: '🏏',
  BOWLER: '🎳',
  ALL_ROUNDER: '⚡',
  WICKET_KEEPER: '🧤',
};

const ROLE_VARIANTS: Record<string, any> = {
  BATSMAN: 'primary',
  BOWLER: 'success',
  ALL_ROUNDER: 'warning',
  WICKET_KEEPER: 'danger',
};

function PlayersPage() {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  useEffect(() => {
    playersApi.getAll()
      .then(({ data }) => setPlayers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const roles = ['ALL', 'BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'];

  const filtered = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  const topRunners = [...players].sort((a, b) => b.totalRuns - a.totalRuns).slice(0, 3);
  const topWickets = [...players].sort((a, b) => b.totalWickets - a.totalWickets).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-text transition-colors duration-200">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Players & Statistics</h1>
            <p className="text-muted text-lg">Comprehensive career profiles and performance tracks.</p>
          </div>
        </div>

        {/* Leaderboards */}
        {!loading && players.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Top Run Scorers */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="p-2 bg-primary/10 rounded-lg text-primary text-2xl">🏏</span>
                Top Run-Scorers
              </h2>
              <div className="space-y-4">
                {topRunners.map((p, i) => (
                  <Link key={p.id} href={`/players/${p.id}`} className="group">
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "text-xl font-black w-8 text-center",
                          i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : "text-amber-600"
                        )}>
                          #{i + 1}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold group-hover:text-primary transition-colors">{p.name}</p>
                          <p className="text-[10px] text-muted uppercase font-bold tracking-widest leading-none">
                            {p.role?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-primary">{p.totalRuns}</span>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest leading-none mt-1">Runs</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Top Wicket Takers */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="p-2 bg-success/10 rounded-lg text-success text-2xl">🎳</span>
                Top Wicket-Takers
              </h2>
              <div className="space-y-4">
                {topWickets.map((p, i) => (
                  <Link key={p.id} href={`/players/${p.id}`} className="group">
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "text-xl font-black w-8 text-center",
                          i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : "text-amber-600"
                        )}>
                          #{i + 1}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center font-bold text-success">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold group-hover:text-success transition-colors">{p.name}</p>
                          <p className="text-[10px] text-muted uppercase font-bold tracking-widest leading-none">
                            {p.role?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-success">{p.totalWickets}</span>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest leading-none mt-1">Wickets</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by player name..."
            className="flex-1"
          />
          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {roles.map(r => (
              <Button
                key={r}
                variant={roleFilter === r ? 'primary' : 'secondary'}
                onClick={() => setRoleFilter(r)}
                size="sm"
                className="whitespace-nowrap rounded-full px-4"
              >
                {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Player Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Skeleton variant="rect" className="w-16 h-16 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <Card variant="glass" className="py-20 flex flex-col items-center">
                 <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center text-3xl mb-4">🔍</div>
                 <h3 className="text-xl font-bold">No players matches your search</h3>
                 <p className="text-muted mt-2">Try adjusting your filters or search term.</p>
              </Card>
            </div>
          ) : (
            filtered.map((player) => (
              <Link key={player.id} href={`/players/${player.id}`}>
                <Card className="p-6 hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer group h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform overflow-hidden border border-primary/20">
                      {player.avatarUrl ? (
                         <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                         <span className="text-3xl font-black text-primary">
                           {player.name.charAt(0)}
                         </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">{player.name}</h3>
                      <p className="text-sm text-muted font-black">#{player.jerseyNumber || '—'}</p>
                    </div>
                  </div>

                  <div className="mb-6 flex flex-wrap gap-2">
                    {player.role && (
                      <Badge variant={ROLE_VARIANTS[player.role] || 'outline'} className="py-1 px-3">
                        {ROLE_ICONS[player.role]} {player.role.replace('_', ' ')}
                      </Badge>
                    )}
                    {player.battingStyle && (
                       <Badge variant="outline" className="border-border/50 text-muted px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                         BAT: {player.battingStyle.replace('_', '-')}
                       </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Runs', value: player.totalRuns, color: 'text-primary' },
                      { label: 'Wickets', value: player.totalWickets, color: 'text-success' },
                      { label: 'SR', value: player.strikeRate?.toFixed(1) || '0.0', color: 'text-warning' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-muted/5 rounded-xl py-3 px-2 text-center border border-border/5 hover:bg-muted/10 transition-colors">
                        <div className={cn("text-xl font-black", stat.color)}>{stat.value}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-muted mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default withAuth(PlayersPage);
