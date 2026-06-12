import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { ModernLoader } from '@/shared/components/ModernLoader';

/**
 * Index route: redirects to dashboard if logged in, otherwise to login screen.
 * Mirrors the PWA's root "/" route logic in AppRoutes.tsx.
 */
export default function Index() {
  const { isLogin, loading } = useAuth();

  if (loading) return <ModernLoader />;

  return <Redirect href={isLogin ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}
