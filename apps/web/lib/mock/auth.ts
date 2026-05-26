"use client";

const KEY = "tuned:mock-session";

export type MockSession = {
  userId: string;
  username: string;
};

const DEFAULT: MockSession = { userId: "mock-malik", username: "malik" };

export function getMockSession(): MockSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockSession;
  } catch {
    return null;
  }
}

export function signInMock(session: MockSession = DEFAULT): MockSession {
  if (typeof window === "undefined") return session;
  window.localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("tuned:session"));
  return session;
}

export function signOutMock(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("tuned:session"));
}

export function requireMockSession(): MockSession {
  return getMockSession() ?? signInMock();
}
