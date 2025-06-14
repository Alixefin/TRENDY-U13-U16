const ADMIN_PIN = "1305";
const AUTH_KEY = "tournament_admin_auth";

export const checkAdminPin = (pin: string): boolean => {
  return pin === ADMIN_PIN;
};

export const setAdminAuthenticated = (): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, "true");
  }
};

export const isAdminAuthenticated = (): boolean => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_KEY) === "true";
  }
  return false;
};

export const clearAdminAuthentication = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
};
