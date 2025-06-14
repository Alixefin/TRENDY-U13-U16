import React from 'react';
import MatchesTabs from '@/components/user/matches/MatchesTabs';
import { mockMatches } from '@/lib/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Matches | Trendy's Tournament Tracker",
  description: "View all scheduled, live, and completed matches.",
};

export default function MatchesPage() {
  // In a real app, fetch matches data here
  const matches = mockMatches;

  return (
    <MatchesTabs matches={matches} />
  );
}
