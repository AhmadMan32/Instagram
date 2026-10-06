import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import {
  notificationArchiveNative,
  type CapturedNotification,
} from "@/modules/notification-archive";

export interface AccountProfile {
  id: string;
  label: string;
  handle: string;
  matchTerm: string;
}

export interface ArchiveEntry {
  id: string;
  title: string;
  body: string;
  accountHint: string;
  receivedAt: number;
  accountId: string | null;
}

interface ArchiveContextValue {
  entries: ArchiveEntry[];
  profiles: AccountProfile[];
  nativeAvailable: boolean;
  hasAccess: boolean;
  captureEnabled: boolean;
  loading: boolean;
  storageError: string | null;
  refresh: () => Promise<void>;
  addProfile: (profile: Omit<AccountProfile, "id">) => Promise<void>;
  removeProfile: (profileId: string) => Promise<void>;
  assignEntry: (entryId: string, profileId: string | null) => Promise<void>;
  removeEntry: (entryId: string) => Promise<void>;
  clearArchive: () => Promise<void>;
  openNotificationSettings: () => Promise<boolean>;
  setCaptureEnabled: (enabled: boolean) => Promise<boolean>;
}

const ENTRY_STORAGE_KEY = "@insta-notification-archive/entries-v1";
const PROFILE_STORAGE_KEY = "@insta-notification-archive/profiles-v1";
const MAX_ARCHIVE_ENTRIES = 2500;

const ArchiveContext = createContext<ArchiveContextValue | null>(null);

function parseStoredArray<T>(raw: string | null, key: string): T[] {
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Yerel kayıt biçimi okunamadı (${key}).`);
  }
  return parsed as T[];
}

function inferProfile(
  event: CapturedNotification,
  profiles: AccountProfile[],
): string | null {
  const searchableText =
    `${event.title}\n${event.accountHint}\n${event.body}`.toLocaleLowerCase(
      "tr-TR",
    );
  const matches = profiles.filter((profile) => {
    const handle = profile.handle.trim().toLocaleLowerCase("tr-TR");
    const bareHandle = handle.startsWith("@") ? handle.slice(1) : handle;
    const matchTerm = profile.matchTerm.trim().toLocaleLowerCase("tr-TR");
    return [handle, bareHandle, matchTerm].some(
      (term) => term.length > 0 && searchableText.includes(term),
    );
  });
  return matches.length === 1 ? matches[0].id : null;
}

function mergeCaptured(
  existing: ArchiveEntry[],
  captured: CapturedNotification[],
  profiles: AccountProfile[],
): ArchiveEntry[] {
  const byId = new Map(existing.map((entry) => [entry.id, entry]));
  for (const event of captured) {
    if (!event.id || (!event.title && !event.body) || byId.has(event.id)) {
      continue;
    }
    byId.set(event.id, {
      id: event.id,
      title: event.title,
      body: event.body,
      accountHint: event.accountHint,
      receivedAt: event.postedAt,
      accountId: inferProfile(event, profiles),
    });
  }
  return Array.from(byId.values())
    .sort((left, right) => right.receivedAt - left.receivedAt)
    .slice(0, MAX_ARCHIVE_ENTRIES);
}

export function ArchiveProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [profiles, setProfiles] = useState<AccountProfile[]>([]);
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [captureEnabled, setCaptureEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  const entriesRef = useRef<ArchiveEntry[]>([]);
  const profilesRef = useRef<AccountProfile[]>([]);
  const refreshingRef = useRef(false);

  const commitEntries = useCallback(async (next: ArchiveEntry[]) => {
    entriesRef.current = next;
    setEntries(next);
    await AsyncStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const commitProfiles = useCallback(async (next: AccountProfile[]) => {
    profilesRef.current = next;
    setProfiles(next);
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setStorageError(null);

    try {
      const [[, storedEntries], [, storedProfiles]] =
        await AsyncStorage.multiGet([
          ENTRY_STORAGE_KEY,
          PROFILE_STORAGE_KEY,
        ]);
      const localEntries = parseStoredArray<ArchiveEntry>(
        storedEntries,
        "arşiv",
      );
      const localProfiles = parseStoredArray<AccountProfile>(
        storedProfiles,
        "hesap etiketleri",
      );
      entriesRef.current = localEntries;
      profilesRef.current = localProfiles;
      setEntries(localEntries);
      setProfiles(localProfiles);

      const available = notificationArchiveNative.isAvailable();
      setNativeAvailable(available);
      if (!available) {
        setHasAccess(false);
        setCaptureEnabledState(false);
        return;
      }

      const permissionGranted = await notificationArchiveNative.hasAccess();
      setHasAccess(permissionGranted);
      const isEnabled =
        await notificationArchiveNative.isCaptureEnabled();
      setCaptureEnabledState(isEnabled);

      if (!permissionGranted) return;

      const captured =
        await notificationArchiveNative.getCapturedNotifications();
      if (captured.length === 0) return;

      const merged = mergeCaptured(
        entriesRef.current,
        captured,
        profilesRef.current,
      );
      await commitEntries(merged);
      await notificationArchiveNative.acknowledgeCapturedNotifications(
        captured.map((event) => event.id),
      );
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "Cihazdaki arşiv okunamadı.",
      );
    } finally {
      refreshingRef.current = false;
      setLoading(false);
    }
  }, [commitEntries]);

  useEffect(() => {
    void refresh();
    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") void refresh();
      },
    );
    const interval = setInterval(() => {
      if (AppState.currentState === "active") void refresh();
    }, 4500);

    return () => {
      appStateSubscription.remove();
      clearInterval(interval);
    };
  }, [refresh]);

  const addProfile = useCallback(
    async (profile: Omit<AccountProfile, "id">) => {
      const next: AccountProfile[] = [
        {
          ...profile,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
        ...profilesRef.current,
      ];
      await commitProfiles(next);
    },
    [commitProfiles],
  );

  const removeProfile = useCallback(
    async (profileId: string) => {
      const nextProfiles = profilesRef.current.filter(
        (profile) => profile.id !== profileId,
      );
      await commitProfiles(nextProfiles);

      const nextEntries = entriesRef.current.map((entry) =>
        entry.accountId === profileId
          ? { ...entry, accountId: null }
          : entry,
      );
      await commitEntries(nextEntries);
    },
    [commitEntries, commitProfiles],
  );

  const assignEntry = useCallback(
    async (entryId: string, profileId: string | null) => {
      const next = entriesRef.current.map((entry) =>
        entry.id === entryId ? { ...entry, accountId: profileId } : entry,
      );
      await commitEntries(next);
    },
    [commitEntries],
  );

  const removeEntry = useCallback(
    async (entryId: string) => {
      await commitEntries(
        entriesRef.current.filter((entry) => entry.id !== entryId),
      );
    },
    [commitEntries],
  );

  const clearArchive = useCallback(async () => {
    await commitEntries([]);
    await notificationArchiveNative.clearCapturedNotifications();
  }, [commitEntries]);

  const openNotificationSettings = useCallback(async () => {
    return notificationArchiveNative.openSettings();
  }, []);

  const setCaptureEnabled = useCallback(async (enabled: boolean) => {
    const result =
      await notificationArchiveNative.setCaptureEnabled(enabled);
    if (result) setCaptureEnabledState(enabled);
    return result;
  }, []);

  const value = useMemo<ArchiveContextValue>(
    () => ({
      entries,
      profiles,
      nativeAvailable,
      hasAccess,
      captureEnabled,
      loading,
      storageError,
      refresh,
      addProfile,
      removeProfile,
      assignEntry,
      removeEntry,
      clearArchive,
      openNotificationSettings,
      setCaptureEnabled,
    }),
    [
      entries,
      profiles,
      nativeAvailable,
      hasAccess,
      captureEnabled,
      loading,
      storageError,
      refresh,
      addProfile,
      removeProfile,
      assignEntry,
      removeEntry,
      clearArchive,
      openNotificationSettings,
      setCaptureEnabled,
    ],
  );

  return (
    <ArchiveContext.Provider value={value}>
      {children}
    </ArchiveContext.Provider>
  );
}

export function useArchive() {
  const context = useContext(ArchiveContext);
  if (!context) {
    throw new Error("useArchive must be used inside ArchiveProvider.");
  }
  return context;
}
