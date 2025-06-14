import React from 'react';

interface TournamentLogoProps {
  appName?: string;
  tournamentName?: string;
  size?: 'small' | 'medium' | 'large';
}

// A simple SVG logo placeholder
const DefaultLogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-primary mr-2">
    <path d="M50 0L61.8 23.5L88.2 23.5L68.2 38.2L76.4 61.8L50 47.1L23.6 61.8L31.8 38.2L11.8 23.5L38.2 23.5L50 0Z" />
    <path d="M50 25C41.7157 25 35 31.7157 35 40C35 48.2843 41.7157 55 50 55C58.2843 55 65 48.2843 65 40C65 31.7157 58.2843 25 50 25ZM50 50C44.4772 50 40 45.5228 40 40C40 34.4772 44.4772 30 50 30C55.5228 30 60 34.4772 60 40C60 45.5228 55.5228 50 50 50Z" />
    <circle cx="50" cy="75" r="15" />
  </svg>
);


const TournamentLogo: React.FC<TournamentLogoProps> = ({ appName = "Trendy's U13/U16", tournamentName, size = 'medium' }) => {
  let textSize = 'text-xl';
  if (size === 'small') textSize = 'text-lg';
  if (size === 'large') textSize = 'text-2xl';

  return (
    <div className="flex items-center">
      <DefaultLogoIcon />
      <div className="flex flex-col">
        <span className={`font-headline font-semibold ${textSize} leading-tight`}>
          {appName}
        </span>
        {tournamentName && (
          <span className={`font-headline text-xs ${size === 'small' ? 'hidden' : ''} opacity-80 leading-tight`}>
            {tournamentName}
          </span>
        )}
      </div>
    </div>
  );
};

export default TournamentLogo;
