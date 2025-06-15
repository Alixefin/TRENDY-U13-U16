
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Match } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, RadioTower, CheckCircle, CalendarDays } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

interface MatchCardProps {
  match: Match;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const { teamA, teamB, dateTime, venue, status, scoreA, scoreB } = match;

  const [displayDateTime, setDisplayDateTime] = useState<string>('Loading date...');

  useEffect(() => {
    const dateObj = new Date(dateTime);
    const formattedDate = dateObj.toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric'
    });
    const formattedTime = dateObj.toLocaleTimeString(undefined, {
      hour: '2-digit', minute: '2-digit'
    });
    setDisplayDateTime(`${formattedDate}, ${formattedTime}`);
  }, [dateTime]);

  const getStatusIcon = () => {
    switch (status) {
      case 'scheduled':
        return <CalendarDays className="h-5 w-5 text-accent" />;
      case 'live':
        return <RadioTower className="h-5 w-5 text-destructive animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  const showLineupCutoff = new Date(new Date(dateTime).getTime() - 10 * 60 * 1000); // 10 minutes before kickoff
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {venue}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-semibold capitalize">{status}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center justify-around mb-3">
          <div className="flex flex-col items-center text-center w-1/3">
            <Image src={teamA.logoUrl} alt={teamA.name} width={48} height={48} className="rounded-full mb-1" data-ai-hint="team logo" />
            <span className="font-semibold text-sm truncate max-w-full">{teamA.name}</span>
          </div>
          <div className="text-center">
            {status === 'live' || status === 'completed' ? (
              <div className="text-2xl font-bold">
                <span>{scoreA ?? 0}</span> - <span>{scoreB ?? 0}</span>
              </div>
            ) : (
              <div className="text-xl font-bold text-muted-foreground">vs</div>
            )}
             {isClient && status === 'scheduled' && new Date() < showLineupCutoff && (
               <CountdownTimer targetDate={new Date(dateTime)} />
             )}
             {isClient && status === 'scheduled' && new Date() >= showLineupCutoff && new Date() < new Date(dateTime) && (
                <p className="text-xs text-primary mt-1">Lineups soon!</p>
             )}
          </div>
          <div className="flex flex-col items-center text-center w-1/3">
            <Image src={teamB.logoUrl} alt={teamB.name} width={48} height={48} className="rounded-full mb-1" data-ai-hint="team logo" />
            <span className="font-semibold text-sm truncate max-w-full">{teamB.name}</span>
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground flex items-center justify-center">
            <Clock className="h-3 w-3 mr-1" /> {displayDateTime}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/match/${match.id}`}>View Match Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MatchCard;
