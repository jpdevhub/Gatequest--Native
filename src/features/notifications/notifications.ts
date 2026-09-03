/**
 * Notifications — permissions, the local daily study reminder, and Expo push
 * token registration.
 *
 * The daily reminder is a *local* notification, so it works without any server.
 * The push token is registered so the Supabase reminder jobs can target this
 * device once they are enabled for the native app.
 */
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/shared/utils/supabaseClient';

const DAILY_REMINDER_ID = 'gatequest-daily-reminder';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export async function ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync('default', {
        name: 'Study reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: '#3b82f6',
    });
}

export async function requestNotificationPermission(): Promise<boolean> {
    await ensureAndroidChannel();

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

/**
 * Schedules (or reschedules) the daily practice reminder at the given hour.
 * Passing `null` cancels it.
 */
export async function scheduleDailyReminder(hour: number | null): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {
        // Nothing scheduled yet — nothing to cancel.
    });

    if (hour === null) return;

    await Notifications.scheduleNotificationAsync({
        identifier: DAILY_REMINDER_ID,
        content: {
            title: 'Time to practice',
            body: 'A few questions today keeps your streak alive.',
            data: { route: '/practice' },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute: 0,
            channelId: 'default',
        },
    });
}

/**
 * Registers this device's Expo push token against the signed-in user.
 * Returns the token, or null when push is unavailable (simulator, denied, no project id).
 */
export async function registerPushToken(userId: string): Promise<string | null> {
    try {
        const granted = await requestNotificationPermission();
        if (!granted) return null;

        const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ??
            Constants.easConfig?.projectId;

        if (!projectId || projectId === 'YOUR_EAS_PROJECT_ID') {
            console.warn('[push] no EAS project id configured; skipping token registration');
            return null;
        }

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (!token) return null;

        const { error } = await supabase.from('push_subscriptions').upsert(
            {
                user_id: userId,
                endpoint: token,
                expo_push_token: token,
                platform: Platform.OS,
            },
            { onConflict: 'endpoint' }
        );

        if (error) console.error('[push] failed to save token', error);

        return token;
    } catch (err) {
        console.error('[push] registration failed', err);
        return null;
    }
}

export async function unregisterPushToken(userId: string): Promise<void> {
    try {
        await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId)
            .not('expo_push_token', 'is', null);
    } catch (err) {
        console.error('[push] failed to remove token', err);
    }
}

/** Maps a notification payload to an in-app route. */
export function routeForNotification(data: unknown): string | null {
    if (!data || typeof data !== 'object') return null;
    const route = (data as { route?: unknown }).route;
    if (typeof route !== 'string') return null;

    // Only allow the routes the reminder jobs actually send.
    const allowed = ['/practice', '/revision', '/topic-test', '/(tabs)/dashboard'];
    return allowed.includes(route) ? route : null;
}
