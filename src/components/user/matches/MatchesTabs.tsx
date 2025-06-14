"use client";

import React, { useState, useMemo } from 'react';
import type { Match } from '@/types';
import MatchCard from './MatchCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface MatchesTabsProps {
  matches: Match[];
}

const MatchesTabs: React.FC<MatchesTabsProps> = ({ matches }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000); // For 'live' status considering recent past

  const scheduledMatches = useMemo(() => 
    matches.filter(match => match.status === 'scheduled' && new Date(match.dateTime) > now && 
      (match.teamA.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       match.teamB.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       match.venue.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [matches, searchTerm, now]
  );

  const liveMatches = useMemo(() => 
    matches.filter(match => match.status === 'live' && 
      (match.teamA.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       match.teamB.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       match.venue.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [matches, searchTerm]
  );

  const playedMatches = useMemo(() => 
    matches.filter(match => match.status === 'completed' && 
      (match.teamA.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       match.teamB.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       match.venue.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()), // Show most recent first
    [matches, searchTerm]
  );
  
  const renderMatchList = (matchList: Match[], emptyMessage: string) => {
    if (matchList.length === 0) {
      return <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matchList.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-headline font-bold mb-2 text-center md:text-left">Match Center</h1>
      <p className="text-muted-foreground mb-6 text-center md:text-left">Stay updated with all scheduled, live, and completed matches.</p>
      
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          type="text"
          placeholder="Search matches by team or venue..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full md:w-1/2 lg:w-1/3"
        />
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
          <TabsTrigger value="live">Live ({liveMatches.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduledMatches.length})</TabsTrigger>
          <TabsTrigger value="played">Played ({playedMatches.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="live">
          {renderMatchList(liveMatches, "No matches currently live.")}
        </TabsContent>
        <TabsContent value="scheduled">
          {renderMatchList(scheduledMatches, "No upcoming matches scheduled or matching your search.")}
        </TabsContent>
        <TabsContent value="played">
          {renderMatchList(playedMatches, "No matches have been played yet or matching your search.")}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchesTabs;
