import '../global.css';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
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

export default function RootLayout() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    storage.hydrate().finally(() => setHydrated(true));
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
                  <Stack screenOptions={{ headerShown: false }} />
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
