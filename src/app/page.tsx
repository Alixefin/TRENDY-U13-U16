"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/common/SplashScreen';

export default function HomePage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinished = () => {
    setShowSplash(false);
    router.replace('/matches');
  };
  
  // This effect guards against direct navigation to / if splash is already done.
  // Useful if component state is lost but app logic means splash shouldn't re-appear.
  useEffect(() => {
    if (!showSplash) {
      router.replace('/matches');
    }
  }, [showSplash, router]);

  if (showSplash) {
    return <SplashScreen onFinished={handleSplashFinished} />;
  }

  return null; // Or a loading indicator while redirecting
}
