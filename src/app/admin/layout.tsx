"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogOut, ShieldCheck, Users, CalendarClock, Trophy, Settings2 } from 'lucide-react';
import Link from 'next/link';
import TournamentLogo from '@/components/common/TournamentLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  // For login page, we don't redirect, auth check is handled by login page itself.
  const shouldRedirect = pathname !== '/admin/login';
  const { isAuthenticated, loading, logout } = useAdminAuth(shouldRedirect);
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);


  useEffect(() => {
    if (!loading && !isAuthenticated && shouldRedirect) {
      router.replace('/admin/login');
    }
  }, [loading, isAuthenticated, router, shouldRedirect]);

  if (loading && shouldRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <ShieldCheck className="h-16 w-16 animate-pulse text-primary" />
        <p className="ml-4 text-lg">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAuthenticated && shouldRedirect) {
    // This will be brief as the effect above should redirect.
    // Or, you could return null and let the redirect handle it.
    return null; 
  }
  
  // If it's the login page and user is already authenticated, redirect to dashboard
  if (pathname === '/admin/login' && isAuthenticated) {
    router.replace('/admin/dashboard');
    return null; // Or a loading indicator
  }
  
  // Don't render admin layout for login page.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const AdminSidebarContent = () => (
    <>
      <div className="mb-8 px-4 pt-4">
         <Link href="/admin/dashboard">
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
      </nav>
      <div className="mt-auto p-2">
        <Button variant="outline" className="w-full justify-start text-sm py-5" onClick={logout}>
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );


  return (
    <div className="flex min-h-screen bg-muted/40">
      {isMobile ? (
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-72 p-0 flex flex-col bg-background">
            <AdminSidebarContent />
          </SheetContent>
        </Sheet>
      ) : (
        <aside className="sticky top-0 h-screen w-64 border-r bg-background flex flex-col">
          <AdminSidebarContent />
        </aside>
      )}
      
      <div className="flex-1 flex flex-col">
        {isMobile && (
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
        )}
         {!isMobile && (
          <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b bg-background px-6">
            <ThemeToggle />
          </header>
        )}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
