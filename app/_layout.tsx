import { useEffect, useState } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GoalProvider } from '@/providers/GoalProvider';
import { StatsProvider } from '@/providers/StatsProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { AppSettingsProvider } from '@/providers/AppSettingsProvider';
import { storage } from '@/shared/utils/storageService';
import ErrorBoundary from '@/shared/components/ErrorBoundary';
import { flushStorage } from '@/shared/storage/appStorage';
import useDailyReminder from '@/features/notifications/useDailyReminder';
import { routeForNotification } from '@/features/notifications/notifications';
import * as Notifications from 'expo-notifications';

/** Lives inside the providers so it can read auth and settings. */
function AppEffects() {
  useDailyReminder();

  // Tapping a reminder opens the screen it points at.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = routeForNotification(response.notification.request.content.data);
      if (route) router.push(route as never);
    });
    return () => sub.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    storage.hydrate().finally(() => setHydrated(true));
  }, []);

  // Pending writes must not be lost when the app is backgrounded or killed.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flushStorage();
    });
    return () => sub.remove();
  }, []);

  // Block render until storage is hydrated so providers get sync cache hits
  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#3470f9" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GoalProvider>
          <StatsProvider>
            <AuthProvider>
              <AppSettingsProvider>
                <BottomSheetModalProvider>
                  <StatusBar style="light" />
                  <AppEffects />
                  <ErrorBoundary label="root">
                    <Stack screenOptions={{ headerShown: false }} />
                  </ErrorBoundary>
                  <Toaster />
                </BottomSheetModalProvider>
              </AppSettingsProvider>
            </AuthProvider>
          </StatsProvider>
        </GoalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
