/**
 * Keeps the local daily reminder in sync with the user's settings, and registers
 * this device's push token once the user opts in.
 */
import { useEffect, useRef } from 'react';
import { useAppSettings } from '@/providers/AppSettingsProvider';
import { useAuth } from '@/providers/AuthProvider';
import {
    registerPushToken,
    requestNotificationPermission,
    scheduleDailyReminder,
} from './notifications';

export default function useDailyReminder() {
    const { settings } = useAppSettings();
    const { user, isLogin } = useAuth();
    const registeredFor = useRef<string | null>(null);

    const { notifications, dailyReminderHour } = settings;

    useEffect(() => {
        let cancelled = false;

        const sync = async () => {
            if (!notifications) {
                await scheduleDailyReminder(null);
                return;
            }

            const granted = await requestNotificationPermission();
            if (cancelled || !granted) return;

            await scheduleDailyReminder(dailyReminderHour);

            if (isLogin && user?.id && registeredFor.current !== user.id) {
                registeredFor.current = user.id;
                await registerPushToken(user.id);
            }
        };

        void sync();
        return () => {
            cancelled = true;
        };
    }, [notifications, dailyReminderHour, isLogin, user?.id]);
}
