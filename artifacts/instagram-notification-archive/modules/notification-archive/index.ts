import { NativeModules, Platform } from "react-native";

export interface CapturedNotification {
  id: string;
  title: string;
  body: string;
  accountHint: string;
  postedAt: number;
}

interface NotificationArchiveBridge {
  hasAccess(): Promise<boolean>;
  openSettings(): Promise<boolean>;
  isCaptureEnabled(): Promise<boolean>;
  setCaptureEnabled(enabled: boolean): Promise<boolean>;
  getCapturedNotifications(): Promise<CapturedNotification[]>;
  clearCapturedNotifications(): Promise<boolean>;
  acknowledgeCapturedNotifications(ids: string[]): Promise<boolean>;
}

const nativeBridge =
  Platform.OS === "android"
    ? (NativeModules.NotificationArchive as
        | NotificationArchiveBridge
        | undefined)
    : undefined;

export const notificationArchiveNative = {
  isAvailable: () => Boolean(nativeBridge),

  async hasAccess() {
    return nativeBridge ? nativeBridge.hasAccess() : false;
  },

  async openSettings() {
    return nativeBridge ? nativeBridge.openSettings() : false;
  },

  async isCaptureEnabled() {
    return nativeBridge ? nativeBridge.isCaptureEnabled() : false;
  },

  async setCaptureEnabled(enabled: boolean) {
    return nativeBridge ? nativeBridge.setCaptureEnabled(enabled) : false;
  },

  async getCapturedNotifications() {
    return nativeBridge
      ? nativeBridge.getCapturedNotifications()
      : [];
  },

  async clearCapturedNotifications() {
    return nativeBridge
      ? nativeBridge.clearCapturedNotifications()
      : false;
  },

  async acknowledgeCapturedNotifications(ids: string[]) {
    return nativeBridge
      ? nativeBridge.acknowledgeCapturedNotifications(ids)
      : false;
  },
};
