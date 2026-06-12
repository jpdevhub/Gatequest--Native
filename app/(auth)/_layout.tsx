import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Auth group layout — only accessible when NOT logged in.
 * Redirects logged-in users to the main tabs.
 */
export default function AuthLayout() {
  const { isLogin } = useAuth();

  if (isLogin) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
