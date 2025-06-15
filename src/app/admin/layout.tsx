
"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogOut, ShieldCheck, Users, CalendarClock, Trophy, Settings2, Eye } from 'lucide-react';
import Link from 'next/link';
import TournamentLogo from '@/components/common/TournamentLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'; // Added SheetTitle
import { Menu } from 'lucide-react';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/teams', label: 'Manage Teams', icon: Users },
  { href: '/admin/matches', label: 'Manage Matches', icon: CalendarClock },
  { href: '/admin/groups', label: 'Manage Groups', icon: Trophy },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const shouldRedirectToLogin = pathname !== '/admin/login';
  const { isAuthenticated, loading, logout } = useAdminAuth(shouldRedirectToLogin);
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);


  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && shouldRedirectToLogin) {
        router.replace('/admin/login');
      } else if (isAuthenticated && pathname === '/admin/login') {
        router.replace('/admin/dashboard');
      }
    }
  }, [loading, isAuthenticated, router, pathname, shouldRedirectToLogin]);


  if (loading && shouldRedirectToLogin && !pathname.startsWith('/admin/login')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <ShieldCheck className="h-16 w-16 animate-pulse text-primary" />
        <p className="ml-4 text-lg">Verifying admin access...</p>
      </div>
    );
  }
  
  if (!isAuthenticated && shouldRedirectToLogin && !pathname.startsWith('/admin/login')) {
    return null; // Redirect is being handled by useEffect
  }
  
  // Allow login page to render if not authenticated or still loading
  if (pathname === '/admin/login') {
     // If authenticated, useEffect will redirect from login.
     // Otherwise, render PinForm (children).
    return <>{children}</>;
  }


  const AdminSidebarContentComponent = () => (
    <>
      {/* Accessible Title for the Sheet, only for screen readers */}
      <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>

      <div className="mb-8 px-4 pt-4">
         <Link href="/admin/dashboard" onClick={() => isMobile && setMobileNavOpen(false)}>
            <TournamentLogo appName="Admin Panel" />
         </Link>
      </div>
      <nav className="flex-grow px-2 space-y-1">
        {adminNavItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href || pathname.startsWith(item.href + '/') ? 'secondary' : 'ghost'}
            className="w-full justify-start text-sm py-5"
            asChild
            onClick={() => isMobile && setMobileNavOpen(false)}
          >
            <Link href={item.href}>
              <item.icon className="mr-3 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
         <Button
            variant={pathname === '/admin/settings' ? 'secondary' : 'ghost'}
            className="w-full justify-start text-sm py-5"
            asChild
            onClick={() => isMobile && setMobileNavOpen(false)}
          >
            <Link href="/admin/settings">
              <Settings2 className="mr-3 h-4 w-4" />
              Tournament Settings
            </Link>
          </Button>
      </nav>
      <div className="mt-auto p-2 space-y-1">
        <Button variant="outline" className="w-full justify-start text-sm py-5" asChild onClick={() => isMobile && setMobileNavOpen(false)}>
          <Link href="/matches" target="_blank" rel="noopener noreferrer">
            <Eye className="mr-3 h-4 w-4" />
            View User Site
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start text-sm py-5" onClick={() => { logout(); if (isMobile) setMobileNavOpen(false);}}>
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <div className="flex min-h-screen flex-col flex-1 bg-muted/40">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
        <SheetContent side="left" className="w-72 p-0 flex flex-col bg-background">
          <AdminSidebarContentComponent />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop layout
  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="sticky top-0 h-screen w-64 border-r bg-background flex flex-col">
        <AdminSidebarContentComponent />
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b bg-background px-6">
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
