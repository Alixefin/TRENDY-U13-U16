"use client";

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
  onZero?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, onZero }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
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

  useEffect(() => {
    if (+new Date(targetDate) - +new Date() <= 0) {
      onZero?.();
      setTimeLeft({}); // Clear countdown when target is reached
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  }); // No dependency array, runs on every render to update time

  const timerComponents: JSX.Element[] = [];

  Object.keys(timeLeft).forEach((interval) => {
    const key = interval as keyof typeof timeLeft;
    if (!timeLeft[key] && timeLeft[key] !==0 ) { // Allow 0 to be shown
      return;
    }
    if (timeLeft.days === 0 && key === 'days') return; // Don't show 0 days

    timerComponents.push(
      <span key={interval} className="mx-1">
        {String(timeLeft[key]).padStart(2, '0')}
        <span className="text-xs opacity-75">{interval.charAt(0)}</span>
      </span>
    );
  });

  return (
    <div className="text-center font-mono text-lg text-primary">
      {timerComponents.length ? timerComponents : <span>Match starting soon!</span>}
    </div>
  );
};

export default CountdownTimer;
