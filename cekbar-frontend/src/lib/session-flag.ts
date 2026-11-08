const EXPIRY_MS = 4 * 60 * 60 * 1000;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return sessionStorage;
}

export function setSessionFlag(key: string): void {
  const storage = getStorage();
  if (!storage) return;
  const data = JSON.stringify({ value: true, expiry: Date.now() + EXPIRY_MS });
  storage.setItem(key, data);
}

export function isSessionFlagActive(key: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  const raw = storage.getItem(key);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as { value: boolean; expiry: number };
    if (Date.now() > parsed.expiry) {
      storage.removeItem(key);
      return false;
    }
    return parsed.value;
  } catch {
    storage.removeItem(key);
    return false;
  }
}
