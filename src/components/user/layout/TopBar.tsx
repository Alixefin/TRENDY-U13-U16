
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TournamentLogo from '@/components/common/TournamentLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { supabase } from '@/lib/supabaseClient';
import type { TournamentInfo } from '@/types'; // Not strictly needed here if only fetching name/logo
import { placeholderTeamLogo } from '@/lib/data'; // For potential fallback logic

const TopBar: React.FC = () => {
  const [tournamentName, setTournamentName] = useState<string>("Trendy's U13/U16");
  const [tournamentLogoUrl, setTournamentLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournamentDetails = async () => {
      const { data, error } = await supabase
        .from('tournament_settings')
        .select('name, logo_url') // Fetch both name and logo_url
        .eq('id', 1)
        .single();

      if (data) {
        if (data.name) {
          setTournamentName(data.name);
        }
        if (data.logo_url) { // logo_url is snake_case from DB
          setTournamentLogoUrl(data.logo_url);
        }
      } else if (error) {
        console.warn("Could not fetch tournament details for TopBar:", error.message);
      }
    };
    fetchTournamentDetails();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/matches" aria-label="Go to homepage">
          {/* Pass the fetched tournamentName and tournamentLogoUrl (which is snake_case from db but TournamentLogo expects camelCase `logoUrl`) */}
          {/* TournamentLogo component internally handles if logoUrl is null */}
          <TournamentLogo
            appName="" // Explicitly empty if tournamentName should be the primary display
            tournamentName={tournamentName}
            logoUrl={tournamentLogoUrl} // Pass the fetched logo URL
            size="small"
          />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default TopBar;
