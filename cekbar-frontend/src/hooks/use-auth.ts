import { useState, useEffect } from "react";

type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  nama?: string;
};

type ResellerInfo = {
  ceirBalance: number | null;
  activeUsers: number;
};

type AuthData = {
  user: AuthUser | null;
  resellerInfo: ResellerInfo | null;
  loading: boolean;
};

let cachedData: { user: AuthUser; resellerInfo: ResellerInfo | null } | null = null;
let fetchPromise: Promise<{ user: AuthUser; resellerInfo: ResellerInfo | null } | null> | null = null;

async function fetchAuth() {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.user) return null;
    return {
      user: data.user as AuthUser,
      resellerInfo: (data.resellerInfo as ResellerInfo) ?? null,
    };
  } catch {
    return null;
  }
}

export function useAuth(): AuthData {
  const [data, setData] = useState<AuthData>(() => {
    if (cachedData) return { ...cachedData, loading: false };
    return { user: null, resellerInfo: null, loading: true };
  });

  useEffect(() => {
    if (cachedData) {
      setData({ ...cachedData, loading: false });
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchAuth();
    }

    fetchPromise.then((result) => {
      if (result) {
        cachedData = result;
        setData({ ...result, loading: false });
      } else {
        setData({ user: null, resellerInfo: null, loading: false });
      }
    });
  }, []);

  return data;
}

export function clearAuthCache() {
  cachedData = null;
  fetchPromise = null;
}
