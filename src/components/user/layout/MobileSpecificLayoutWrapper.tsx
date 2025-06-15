
"use client";

import React from 'react';
import TopBar from '@/components/user/layout/TopBar';
import UserNavigation from '@/components/user/layout/UserNavigation';
import { useIsMobile } from '@/hooks/use-is-mobile';

export default function MobileSpecificLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {isMobile ? <TopBar /> : <UserNavigation />}
      <main className="flex-1 overflow-y-auto">
        <div className={isMobile ? "pb-20" : ""}> {/* Padding for bottom nav */}
         {children}
        </div>
      </main>
      {isMobile && <UserNavigation />}
    </div>
  );
}
