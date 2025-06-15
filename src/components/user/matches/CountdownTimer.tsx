
"use client";

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date; // Ensure this is a Date object
  onZero?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, onZero }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date(); // Ensure targetDate is treated as Date
    let timeLeft: { days?: number; hours?: number; minutes?: number; seconds?: number } = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Component has mounted on client
  }, []);

  useEffect(() => {
    if (!isClient) return; // Don't run countdown logic on server or before client mount

    if (+new Date(targetDate) - +new Date() <= 0) {
      setTimeLeft({}); // Clear countdown when target is reached
      onZero?.();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  }, [isClient, timeLeft, targetDate, onZero]); // Rerun when timeLeft changes or targetDate changes, only on client

  if (!isClient) {
    // Render a placeholder or nothing on the server / initial client render before effect
    return <div className="text-center font-mono text-lg text-primary">Loading countdown...</div>;
  }

  const timerComponents: JSX.Element[] = [];
  let hasTime = false;

  Object.keys(timeLeft).forEach((interval) => {
    const key = interval as keyof typeof timeLeft;
    if (timeLeft[key] !== undefined && timeLeft[key]! >= 0) { // Allow 0 to be shown
      if(timeLeft.days === 0 && key === 'days' && Object.keys(timeLeft).length > 1) return; // Don't show 0 days if other units exist

      timerComponents.push(
        <span key={interval} className="mx-1">
          {String(timeLeft[key]).padStart(2, '0')}
          <span className="text-xs opacity-75">{interval.charAt(0)}</span>
        </span>
      );
      if (timeLeft[key]! > 0) hasTime = true;
      if (timeLeft[key]! === 0 && key === 'seconds' && Object.keys(timeLeft).length === 1) hasTime = false; // If only 0s left
    }
  });
  
  if (!hasTime && timerComponents.length > 0 && Object.values(timeLeft).every(v => v === 0)) {
     // This case means all units are zero, but not yet "Match starting soon"
  } else if (timerComponents.length === 0 || !hasTime) {
      return <div className="text-center font-mono text-lg text-primary">Match starting soon!</div>;
  }


  return (
    <div className="text-center font-mono text-lg text-primary">
      {timerComponents}
    </div>
  );
};

export default CountdownTimer;
