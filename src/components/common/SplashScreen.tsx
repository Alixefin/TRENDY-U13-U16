"use client";

import React, { useEffect, useState } from 'react';
import TournamentLogo from './TournamentLogo';

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000); // Show splash for 2 seconds

    const finishTimer = setTimeout(() => {
        onFinished();
    }, 2500); // Call onFinished after fade out

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    }
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isVisible}
      role="alertdialog"
      aria-labelledby="splash-title"
    >
      <TournamentLogo appName="Trendy's U13/U16" size="large" />
      <p id="splash-title" className="mt-4 text-lg font-headline text-primary animate-pulse">
        Loading Tournament...
      </p>
    </div>
  );
};

export default SplashScreen;
