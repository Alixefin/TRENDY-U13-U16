
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TournamentLogo from '@/components/common/TournamentLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { supabase } from '@/lib/supabaseClient';
import type { TournamentInfo } from '@/types';
import { placeholderTeamLogo } from '@/lib/data';

const TopBar: React.FC = () => {
  const [tournamentName, setTournamentName] = useState<string>("Trendy's U13/U16"); // Default name

  useEffect(() => {
    const fetchTournamentName = async () => {
      const { data, error } = await supabase
        .from('tournament_settings')
        .select('name')
        .eq('id', 1)
        .single();

      if (data && data.name) {
        setTournamentName(data.name);
      } else if (error) {
        console.warn("Could not fetch tournament name for TopBar:", error.message);
      }
    };
    fetchTournamentName();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/matches" aria-label="Go to homepage">
          <TournamentLogo appName="" tournamentName={tournamentName} size="small" />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default TopBar;
