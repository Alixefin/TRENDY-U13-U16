
import React from 'react';
import Image from 'next/image';

interface TournamentLogoProps {
  appName?: string;
  tournamentName?: string;
  size?: 'small' | 'medium' | 'large';
  logoUrl?: string | null; // Accept a logo URL
}

// A simple SVG logo placeholder
const DefaultLogoIcon: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ size = 'medium' }) => {
  const iconSize = size === 'large' ? 40 : 32;
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-primary mr-2">
      <path d="M50 0L61.8 23.5L88.2 23.5L68.2 38.2L76.4 61.8L50 47.1L23.6 61.8L31.8 38.2L11.8 23.5L38.2 23.5L50 0Z" />
      <path d="M50 25C41.7157 25 35 31.7157 35 40C35 48.2843 41.7157 55 50 55C58.2843 55 65 48.2843 65 40C65 31.7157 58.2843 25 50 25ZM50 50C44.4772 50 40 45.5228 40 40C40 34.4772 44.4772 30 50 30C55.5228 30 60 34.4772 60 40C60 45.5228 55.5228 50 50 50Z" />
      <circle cx="50" cy="75" r="15" />
    </svg>
  );
};


const TournamentLogo: React.FC<TournamentLogoProps> = ({ appName = "Trendy's U13/U16", tournamentName, size = 'medium', logoUrl }) => {
  let textSize = 'text-xl';
  let imageSize = 32;
  if (size === 'small') {
    textSize = 'text-lg';
    imageSize = 28;
  }
  if (size === 'large') {
    textSize = 'text-2xl';
    imageSize = 40;
  }


  return (
    <div className="flex items-center">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={tournamentName || appName || 'Tournament Logo'}
          width={imageSize}
          height={imageSize}
          className="mr-2 rounded-sm object-contain"
          data-ai-hint="logo tournament"
        />
      ) : (
        <DefaultLogoIcon size={size} />
      )}
      <div className="flex flex-col">
        <span className={`font-headline font-semibold ${textSize} leading-tight`}>
          {appName || tournamentName} {/* Display tournamentName if appName is empty */}
        </span>
        {appName && tournamentName && ( // Only show tournamentName as subtitle if appName is also present
          <span className={`font-headline text-xs ${size === 'small' ? 'hidden sm:inline' : ''} opacity-80 leading-tight`}>
            {tournamentName}
          </span>
        )}
      </div>
    </div>
  );
};

export default TournamentLogo;
