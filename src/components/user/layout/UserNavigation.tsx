"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListChecks, Trophy, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import TournamentLogo from '@/components/common/TournamentLogo';

const navItems = [
  { href: '/matches', label: 'Matches', icon: ListChecks },
  { href: '/tournament', label: 'Tournament', icon: Trophy },
];

const adminNavItem = { href: '/admin/login', label: 'Admin', icon: Settings };

const UserNavigation: React.FC = () => {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-t-lg">
        <div className="container mx-auto flex h-16 items-center justify-around px-2">
          {[...navItems, adminNavItem].map((item) => (
            <Link key={item.href} href={item.href} legacyBehavior passHref>
              <a
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-md transition-colors hover:bg-accent/10',
                  pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/matches' && item.href !== '/tournament')
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground'
                )}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                <item.icon className="h-6 w-6 mb-0.5" />
                <span className="text-xs">{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <aside className="sticky top-0 h-screen w-64 border-r bg-background p-4 flex flex-col">
      <div className="mb-8">
        <Link href="/matches">
          <TournamentLogo />
        </Link>
      </div>
      <nav className="flex flex-col space-y-2 flex-grow">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/matches' && item.href !== '/tournament') ? 'secondary' : 'ghost'}
            className="w-full justify-start text-base py-6"
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="mt-auto">
         <Button
            variant={pathname.startsWith(adminNavItem.href) ? 'secondary' : 'ghost'}
            className="w-full justify-start text-base py-6"
            asChild
          >
            <Link href={adminNavItem.href}>
              <adminNavItem.icon className="mr-3 h-5 w-5" />
              {adminNavItem.label}
            </Link>
          </Button>
      </div>
    </aside>
  );
};

export default UserNavigation;
