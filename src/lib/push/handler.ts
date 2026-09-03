import * as Notifications from "expo-notifications";

/**
 * Foreground behavior (M31 §10) — a push that arrives while the app is
 * already open never shows an OS banner or plays a sound: the in-app
 * Notification it corresponds to is the same data useNotifications/
 * useUnreadCount already poll, so a banner on top of a screen the user is
 * actively using would just be noise on top of a UI that updates on its
 * own. `shouldShowList: true` keeps it in the OS notification center for
 * later, in case the user backgrounds the app before checking the inbox.
 *
 * Must be called once, at module load, before any screen mounts — same
 * "runs before React" convention as `SplashScreen.preventAutoHideAsync()`
 * in _layout.tsx.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
