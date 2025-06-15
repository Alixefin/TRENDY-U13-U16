
import MatchDetailsPage from '@/components/user/matches/MatchDetailsPage';
import { getMatchById } from '@/lib/data'; // This will be refactored to fetch from Supabase
import type { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import type { Match } from '@/types';

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  const match = await getMatchById(id); // Fetches from Supabase now

  if (!match) {
    return {
      title: "Match Not Found | Trendy's Tournament Tracker",
    };
  }

  return {
    title: `${match.teamA.name} vs ${match.teamB.name} | Trendy's Tournament Tracker`,
    description: `Details for the match between ${match.teamA.name} and ${match.teamB.name} on ${new Date(match.dateTime).toLocaleDateString()}. Venue: ${match.venue}.`,
  };
}

export async function generateStaticParams() {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id');

  if (error || !matches) {
    console.error("Error fetching match IDs for static params:", error?.message);
    return [];
  }
  return matches.map((match) => ({
    id: match.id,
  }));
}

// MatchPage no longer needs to be async if MatchDetailsPage fetches its own data
// or if data is passed directly. Here, MatchDetailsPage internally calls getMatchById
// which is now async and fetches from Supabase.
export default function MatchPage({ params }: { params: { id: string } }) {
  // MatchDetailsPage will call the refactored getMatchById
  return <MatchDetailsPage matchId={params.id} />;
}
