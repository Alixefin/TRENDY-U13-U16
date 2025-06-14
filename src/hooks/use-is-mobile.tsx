// This file is created to ensure useIsMobile hook is available at this specific path,
// as it might be referenced by other generated components.
// It mirrors the functionality of src/hooks/use-mobile.tsx.
"use client";
import * as React from "react"

const MOBILE_BREAKPOINT = 768 // Standard Tailwind md breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return; // Guard for SSR or non-browser environments
    }

    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check
    checkDevice();

    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile === undefined ? false : isMobile; // Return false during SSR or initial undefined state.
}
