
import React from 'react';
import MobileSpecificLayoutWrapper from '@/components/user/layout/MobileSpecificLayoutWrapper';

// This layout is now a Server Component.
// Metadata for child pages like /matches, /tournament, /match/[id] can now be defined in those page files.

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileSpecificLayoutWrapper>
      {children}
    </MobileSpecificLayoutWrapper>
  );
}
