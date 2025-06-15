
import React from 'react';
import Image from 'next/image';
import type { TournamentInfo } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TournamentLogo from '@/components/common/TournamentLogo';

interface TournamentHeaderProps {
  info: TournamentInfo;
}

const TournamentHeader: React.FC<TournamentHeaderProps> = ({ info }) => {
  // Determine if the logoUrl is a placeholder or a real URL for the banner
  // The TournamentLogo component within the banner area will use info.logoUrl IF it's small,
  // otherwise, info.logoUrl is used for the large background.
  // This assumes info.logoUrl from database might be intended as a banner.
  // If a separate smaller logo is always desired on the banner, info should perhaps have info.bannerUrl and info.logoUrl_small.
  // For now, we use info.logoUrl for the main banner image.
  // The TournamentLogo component will display the name.

  const bannerImageUrl = info.logoUrl || "https://placehold.co/1200x400/50C878/FFFFFF.png?text=Stadium+View&font=poppins";

  return (
    <Card className="mb-8 shadow-lg overflow-hidden">
      <div className="relative h-48 md:h-64 w-full">
        <Image
          src={bannerImageUrl}
          alt={`${info.name} banner`}
          fill={true}
          style={{objectFit:"cover"}}
          priority // Prioritize loading the main banner image
          data-ai-hint="stadium crowd tournament"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
          <div className="inline-block bg-background/80 backdrop-blur-sm p-3 rounded-lg shadow-md">
             {/* Here we use TournamentLogo just for text, as the background IS the logo/banner */}
             {/* If info.logoUrl was intended to be a small icon, we'd pass it to TournamentLogo's logoUrl prop here */}
             <TournamentLogo appName="" tournamentName={info.name} size="large" logoUrl={null}/>
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
