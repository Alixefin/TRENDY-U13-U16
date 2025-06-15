
import React from 'react';
import Image from 'next/image';
import type { TournamentInfo } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TournamentLogo from '@/components/common/TournamentLogo'; 

interface TournamentHeaderProps {
  info: TournamentInfo;
}

const TournamentHeader: React.FC<TournamentHeaderProps> = ({ info }) => {
  return (
    <Card className="mb-8 shadow-lg overflow-hidden">
      <div className="relative h-48 md:h-64 w-full">
        <Image 
          src={info.logoUrl || "https://placehold.co/1200x400/50C878/FFFFFF.png?text=Stadium+View&font=poppins"} 
          alt="Tournament banner" 
          fill={true}
          style={{objectFit:"cover"}}
          data-ai-hint="stadium crowd"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
          <div className="inline-block bg-background/80 backdrop-blur-sm p-3 rounded-lg">
             <TournamentLogo appName="" tournamentName={info.name} size="large" />
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <CardTitle className="text-2xl font-headline mb-3">About the Tournament</CardTitle>
        <CardDescription className="text-base leading-relaxed text-foreground/80">
          {info.about || "Information about this tournament will be available soon."}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

export default TournamentHeader;
