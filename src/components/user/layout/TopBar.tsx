import React from 'react';
import Link from 'next/link';
import TournamentLogo from '@/components/common/TournamentLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { mockTournamentInfo } from '@/lib/data';

const TopBar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/matches" aria-label="Go to homepage">
          <TournamentLogo appName="Trendy's U13/U16" tournamentName={mockTournamentInfo.name} size="small" />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default TopBar;
