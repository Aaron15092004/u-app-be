// EXPO GO MOCK — replaces react-native-mmkv with in-memory storage
// Restore to real MMKV implementation before EAS/production build

const store = new Map<string, string | boolean | number>();

const storage = {
  getBoolean: (key: string): boolean | undefined => {
    const v = store.get(key);
    return typeof v === 'boolean' ? v : undefined;
  },
  getString: (key: string): string | undefined => {
    const v = store.get(key);
    return typeof v === 'string' ? v : undefined;
  },
  set: (key: string, value: string | boolean | number): void => {
    store.set(key, value);
  },
  delete: (key: string): void => {
    store.delete(key);
  },
};

export { storage };

const ONBOARDING_SEEN_KEY = 'onboarding_seen';
const CACHED_USER_KEY = 'auth_user';

export function getOnboardingSeen(): boolean {
  return storage.getBoolean(ONBOARDING_SEEN_KEY) ?? false;
}

export function setOnboardingSeen(value: boolean): void {
  storage.set(ONBOARDING_SEEN_KEY, value);
}

export function setCachedUser(user: import('../api/types').IAuthUser): void {
  storage.set(CACHED_USER_KEY, JSON.stringify(user));
}

export function getCachedUser(): import('../api/types').IAuthUser | null {
  const raw = storage.getString(CACHED_USER_KEY);
  return raw ? (JSON.parse(raw) as import('../api/types').IAuthUser) : null;
}

export function clearCachedUser(): void {
  storage.delete(CACHED_USER_KEY);
}

const NOTIF_ASKED_KEY = 'notif_permission_asked';

export function getNotifAsked(): boolean {
  return storage.getBoolean(NOTIF_ASKED_KEY) ?? false;
}

export function setNotifAsked(value: boolean): void {
  storage.set(NOTIF_ASKED_KEY, value);
}
