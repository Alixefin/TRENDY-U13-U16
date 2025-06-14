import React from 'react';
import type { MatchEvent } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListOrdered, Goal, Users, CreditCard } from 'lucide-react'; // Users for substitution, CreditCard for cards

interface MatchEventsLogProps {
  events?: MatchEvent[];
}

const EventIcon: React.FC<{ type: MatchEvent['type'] }> = ({ type }) => {
  switch (type) {
    case 'goal':
      return <Goal className="h-5 w-5 text-green-500 mr-2" />;
    case 'substitution':
      return <Users className="h-5 w-5 text-blue-500 mr-2" />;
    case 'card':
      return <CreditCard className="h-5 w-5 text-yellow-500 mr-2" />; // Default to yellow, could be dynamic
    default:
      return null;
  }
};

const MatchEventsLog: React.FC<MatchEventsLogProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <Card className="mt-6 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center font-headline text-xl">
            <ListOrdered className="h-6 w-6 mr-2 text-primary" />
            Match Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No key events recorded for this match yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center font-headline text-xl">
          <ListOrdered className="h-6 w-6 mr-2 text-primary" />
          Match Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex items-start p-2 border-b last:border-b-0">
              <EventIcon type={event.type} />
              <div>
                <span className="font-semibold text-sm">{event.time} - </span>
                <span className="text-sm capitalize">{event.type}</span>
                {event.playerName && <span className="text-sm"> by {event.playerName}</span>}
                {event.details && <p className="text-xs text-muted-foreground mt-0.5">{event.details}</p>}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default MatchEventsLog;
