import React from 'react';
import Image from 'next/image';
import type { Group } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GroupTableProps {
  group: Group;
}

const GroupTable: React.FC<GroupTableProps> = ({ group }) => {
  return (
    <Card className="mb-6 shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-xl">{group.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-center">MP</TableHead>
              <TableHead className="text-center">W</TableHead>
              <TableHead className="text-center">D</TableHead>
              <TableHead className="text-center">L</TableHead>
              <TableHead className="text-center">GF</TableHead>
              <TableHead className="text-center">GA</TableHead>
              <TableHead className="text-center">GD</TableHead>
              <TableHead className="text-center font-semibold">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.teams
              .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor)
              .map((gt, index) => (
              <TableRow key={gt.team.id} className={gt.isLive ? 'bg-accent/10' : ''}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Image 
                      src={gt.team.logoUrl} 
                      alt={gt.team.name} 
                      width={24} 
                      height={24} 
                      className="rounded-full" 
                      data-ai-hint="team logo"
                    />
                    <span className="font-medium truncate max-w-[100px] sm:max-w-[150px]">{gt.team.name}</span>
                    {gt.isLive && <Badge variant="destructive" className="ml-2 animate-pulse">LIVE</Badge>}
                    {gt.isLive && gt.liveScore && <span className="text-xs text-muted-foreground ml-1">({gt.liveScore})</span>}
                  </div>
                </TableCell>
                <TableCell className="text-center">{gt.played}</TableCell>
                <TableCell className="text-center">{gt.won}</TableCell>
                <TableCell className="text-center">{gt.drawn}</TableCell>
                <TableCell className="text-center">{gt.lost}</TableCell>
                <TableCell className="text-center">{gt.goalsFor}</TableCell>
                <TableCell className="text-center">{gt.goalsAgainst}</TableCell>
                <TableCell className="text-center">{gt.goalDifference}</TableCell>
                <TableCell className="text-center font-semibold text-primary">{gt.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default GroupTable;
