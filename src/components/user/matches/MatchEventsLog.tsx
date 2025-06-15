
import React from 'react';
import type { MatchEvent, CardEvent as CardEventType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListOrdered, Goal, Users, CreditCard } from 'lucide-react'; 
import { cn } from '@/lib/utils';

interface MatchEventsLogProps {
  events?: MatchEvent[];
}

const EventIcon: React.FC<{ event: MatchEvent }> = ({ event }) => {
  switch (event.type) {
    case 'goal':
      return <Goal className="h-5 w-5 text-green-500 mr-2 shrink-0" />;
    case 'substitution':
      return <Users className="h-5 w-5 text-blue-500 mr-2 shrink-0" />;
    case 'card':
      const cardEvent = event as CardEventType;
      return <CreditCard className={cn(
          "h-5 w-5 mr-2 shrink-0",
          cardEvent.cardType === 'yellow' ? 'text-yellow-400' : 'text-red-500'
      )} />;
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

  // Sort events by time string (e.g., "45+2'", "60'")
  const sortedEvents = [...events].sort((a, b) => {
    const parseTime = (timeStr: string): number => {
      const parts = timeStr.match(/(\d+)(\+(\d+))?/);
      if (!parts) return Infinity; // Should not happen with valid time
      let minutes = parseInt(parts[1], 10);
      if (parts[3]) { // Added time
        minutes += parseInt(parts[3], 10) * 0.1; // Make added time sort later but keep integer part primary
      }
      return minutes;
    };
    return parseTime(a.time) - parseTime(b.time);
  });


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
          {sortedEvents.map((event) => (
            <li key={event.id} className="flex items-start p-2 border-b last:border-b-0">
              <EventIcon event={event} />
              <div>
                <span className="font-semibold text-sm">{event.time}' - </span>
                <span className="text-sm capitalize">{event.type}</span>
                {event.playerName && <span className="text-sm"> by {event.playerName}</span>}
                {event.type === 'card' && <span className="text-sm capitalize"> ({(event as CardEventType).cardType})</span>}
                {event.type === 'substitution' && (
                  <span className="text-sm">
                    : {event.playerOutName} (Out) <Users className="h-3 w-3 inline mx-1 text-muted-foreground" /> {event.playerInName} (In)
                  </span>
                )}
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
