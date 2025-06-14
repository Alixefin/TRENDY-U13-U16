import React from 'react';
import type { Team, Player } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface LineupDisplayProps {
  teamA: Team;
  lineupA?: Player[];
  teamB: Team;
  lineupB?: Player[];
}

const TeamLineup: React.FC<{ team: Team; lineup?: Player[] }> = ({ team, lineup }) => {
  if (!lineup || lineup.length === 0) {
    return (
      <div>
        <h4 className="font-semibold text-lg mb-2 font-headline">{team.name}</h4>
        <p className="text-sm text-muted-foreground">Lineup not yet available.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-semibold text-lg mb-2 font-headline">{team.name}</h4>
      <ul className="space-y-1 text-sm">
        {lineup.map((player) => (
          <li key={player.id} className="flex items-center">
            <span className="font-medium w-8 text-right mr-2 text-primary">{player.shirtNumber}</span>
            <span>{player.name}</span>
          </li>
        ))}
      </ul>
      {team.coachName && <p className="text-xs mt-2 text-muted-foreground">Coach: {team.coachName}</p>}
    </div>
  );
};

const LineupDisplay: React.FC<LineupDisplayProps> = ({ teamA, lineupA, teamB, lineupB }) => {
  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center font-headline text-xl">
          <Users className="h-6 w-6 mr-2 text-primary" />
          Team Lineups
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TeamLineup team={teamA} lineup={lineupA} />
          <TeamLineup team={teamB} lineup={lineupB} />
        </div>
      </CardContent>
    </Card>
  );
};

export default LineupDisplay;
