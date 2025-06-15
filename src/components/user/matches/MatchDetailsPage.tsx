
"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Match } from '@/types';
import { getMatchById } from '@/lib/data'; 
import LineupDisplay from './LineupDisplay';
import MatchEventsLog from './MatchEventsLog';
import CountdownTimer from './CountdownTimer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CalendarDays, MapPin, RadioTower, CheckCircle, Clock, ShieldQuestion, Loader2, Hourglass, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface MatchDetailsPageProps {
  matchId: string;
}

const MatchDetailsPage: React.FC<MatchDetailsPageProps> = ({ matchId }) => {
  const [match, setMatch] = useState<Match | null | undefined>(undefined); 
  const [showLineups, setShowLineups] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clientNow, setClientNow] = useState<Date | null>(null);

  useEffect(() => {
    setClientNow(new Date());
    const fetchMatchData = async () => {
      setIsLoading(true);
      const fetchedMatch = await getMatchById(matchId);
      setMatch(fetchedMatch);

      if (fetchedMatch) {
        const matchDateTime = new Date(fetchedMatch.dateTime).getTime();
        if (fetchedMatch.status === 'scheduled') {
          const lineupRevealTime = matchDateTime - 10 * 60 * 1000; // 10 mins before
          if (new Date().getTime() >= lineupRevealTime) {
            setShowLineups(true);
          }
        } else {
          setShowLineups(true); // Show lineups for live/completed/halftime matches
        }
      }
      setIsLoading(false);
    };

    fetchMatchData();
  }, [matchId]);

  if (isLoading || match === undefined) {
    return (
        <div className="container mx-auto py-8 px-4 text-center flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading match details...</p>
        </div>
    );
  }

  if (match === null) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <ShieldQuestion className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Match Not Found</h1>
        <p className="text-muted-foreground mb-6">The match you are looking for does not exist or could not be loaded.</p>
        <Button asChild>
          <Link href="/matches">Back to Matches</Link>
        </Button>
      </div>
    );
  }

  const { teamA, teamB, dateTime, venue, status, scoreA, scoreB, events, lineupA, lineupB, duration, playerOfTheMatch } = match;

  const matchDateTimeObject = new Date(dateTime);
  const formattedDate = matchDateTimeObject.toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedTime = matchDateTimeObject.toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit'
  });

  const getStatusInfo = () => {
    switch (status) {
      case 'scheduled':
        return { icon: <CalendarDays className="h-6 w-6 text-accent" />, text: 'Scheduled' };
      case 'live':
        return { icon: <RadioTower className="h-6 w-6 text-destructive animate-pulse" />, text: 'Live' };
      case 'halftime':
        return { icon: <Hourglass className="h-6 w-6 text-orange-500 animate-pulse" />, text: 'Half Time' };
      case 'completed':
        return { icon: <CheckCircle className="h-6 w-6 text-green-500" />, text: 'Completed' };
      default:
        return { icon: <ShieldQuestion className="h-6 w-6 text-muted-foreground"/>, text: 'Unknown' };
    }
  };
  const statusInfo = getStatusInfo();

  const isCountdownRelevant = status === 'scheduled' && clientNow && matchDateTimeObject > clientNow;


  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {statusInfo.icon}
              <CardTitle className="text-2xl md:text-3xl font-headline">{statusInfo.text}</CardTitle>
            </div>
            <div className="text-sm text-muted-foreground text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end"><MapPin className="h-4 w-4 mr-1" />{venue}</div>
              <div className="flex items-center justify-center md:justify-end"><Clock className="h-4 w-4 mr-1" />{formattedDate} at {formattedTime}</div>
              {duration && <div className="flex items-center justify-center md:justify-end"><Hourglass className="h-4 w-4 mr-1" />{duration} mins</div>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-around mb-6 gap-4 md:gap-8">
            <div className="flex flex-col items-center text-center">
              <Image src={teamA.logoUrl} alt={teamA.name} width={80} height={80} className="rounded-full mb-2" data-ai-hint="team logo" />
              <span className="text-xl font-semibold font-headline">{teamA.name}</span>
            </div>
            <div className="text-center my-4 md:my-0">
              {status === 'live' || status === 'completed' || status === 'halftime' ? (
                <div className="text-5xl font-bold">
                  <span>{scoreA ?? 0}</span> - <span>{scoreB ?? 0}</span>
                </div>
              ) : (
                <div className="text-3xl font-bold text-muted-foreground">vs</div>
              )}
              {isCountdownRelevant && !showLineups && (
                <div className="mt-2">
                  <CountdownTimer targetDate={matchDateTimeObject} onZero={() => setShowLineups(true)} />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center text-center">
              <Image src={teamB.logoUrl} alt={teamB.name} width={80} height={80} className="rounded-full mb-2" data-ai-hint="team logo" />
              <span className="text-xl font-semibold font-headline">{teamB.name}</span>
            </div>
          </div>
          
          {showLineups && <LineupDisplay teamA={teamA} lineupA={lineupA} teamB={teamB} lineupB={lineupB} />}
          
          {(status === 'live' || status === 'completed' || status === 'halftime') && <MatchEventsLog events={events} />}

          {status === 'completed' && playerOfTheMatch && (
            <Card className="mt-6 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center font-headline text-xl">
                  <Award className="h-6 w-6 mr-2 text-amber-500" /> Player of the Match
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">
                  {playerOfTheMatch.name} (#{playerOfTheMatch.shirt_number}) - {playerOfTheMatch.team_id === teamA.id ? teamA.name : teamB.name}
                </p>
              </CardContent>
            </Card>
          )}

        </CardContent>
        <CardFooter className="bg-muted/30 p-6">
            <Button asChild variant="outline">
                <Link href="/matches">Back to All Matches</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MatchDetailsPage;
