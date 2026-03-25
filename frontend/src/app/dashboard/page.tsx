'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import withAuth from '@/components/withAuth';
import { matchesApi } from '@/lib/api';
import { Match } from '@/types';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    matchesApi.getAll()
      .then(({ data }) => setMatches(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const live = matches.filter(m => m.status === 'IN_PROGRESS');
  const completed = matches.filter(m => m.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-background text-text transition-colors duration-200">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted text-lg">Manage and track your cricket matches in real-time.</p>
          </div>
          <Link href="/match/create">
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
              <span className="mr-2 text-xl">+</span> New Match
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Matches', value: matches.length, color: 'primary' },
            { label: 'Live Matches', value: live.length, color: 'success' },
            { label: 'Completed', value: completed.length, color: 'secondary' },
          ].map((s) => (
            <Card key={s.label} className="p-6 flex flex-col items-center justify-center text-center group hover:border-primary/50 transition-all">
              <div className={cn(
                "text-4xl font-black mb-1",
                s.color === 'primary' ? 'text-primary' : s.color === 'success' ? 'text-success' : 'text-muted'
              )}>
                {loading ? <Skeleton className="h-10 w-12 mx-auto" /> : s.value}
              </div>
              <div className="text-sm font-bold uppercase tracking-widest text-muted group-hover:text-text transition-colors">
                {s.label}
              </div>
            </Card>
          ))}
        </div>

        {/* Matches List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Recent Matches</h2>
            <div className="text-sm font-medium text-muted">
              {matches.length} matches found
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 flex items-center gap-4">
                  <Skeleton variant="circle" className="w-3 h-3 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </Card>
              ))}
            </div>
          ) : matches.length === 0 ? (
            <Card variant="glass" className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl mb-6 animate-bounce">
                🏏
              </div>
              <h3 className="text-xl font-bold mb-2">No matches found</h3>
              <p className="text-muted mb-8 max-w-sm">
                Get started by creating your first match and begin scoring ball-by-ball.
              </p>
              <Link href="/match/create">
                <Button>Create Your First Match</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {matches.map((match) => (
                <Card 
                  key={match.id} 
                  className={cn(
                    "p-5 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:shadow-md transition-all group",
                    match.status === 'IN_PROGRESS' ? 'border-primary/30 bg-primary/5' : ''
                  )}
                >
                  <div className="flex items-center gap-4 flex-1 w-full">
                    {/* Status indicator */}
                    <div className={cn(
                      "w-3 h-3 rounded-full flex-shrink-0",
                      match.status === 'IN_PROGRESS' ? 'bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-muted'
                    )} />

                    {/* Team Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                          {match.teamAName}
                        </span>
                        <span className="text-muted font-medium italic">vs</span>
                        <span className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                          {match.teamBName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {match.totalOvers} Overs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Badge and Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border">
                    <Badge variant={match.status === 'IN_PROGRESS' ? 'success' : 'outline'} className="font-black px-3 py-1">
                      {match.status === 'IN_PROGRESS' ? 'LIVE' : 'COMPLETED'}
                    </Badge>

                    <div className="flex items-center gap-2">
                       <Link href={`/match/${match.id}`}>
                        <Button size="sm" variant={match.status === 'IN_PROGRESS' ? 'primary' : 'outline'}>
                          {match.status === 'IN_PROGRESS' ? 'Score Now' : 'View Results'}
                        </Button>
                      </Link>
                      <Link href={`/analytics?matchId=${match.id}`}>
                        <Button size="sm" variant="secondary" className="px-3" title="Statistics">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default withAuth(DashboardPage);
