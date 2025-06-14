import MatchDetailsPage from '@/components/user/matches/MatchDetailsPage';
import { getMatchById, mockMatches } from '@/lib/data';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  const match = getMatchById(id); // In real app, fetch from DB

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

// For static generation, if desired:
export async function generateStaticParams() {
  return mockMatches.map((match) => ({
    id: match.id,
  }));
}


export default function MatchPage({ params }: { params: { id: string } }) {
  return <MatchDetailsPage matchId={params.id} />;
}
