import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { ModernLoader } from '@/shared/components/ModernLoader';
import CustomTabBar from '@/shared/components/CustomTabBar';

export default function TabLayout() {
  const { isLogin, loading } = useAuth();
  if (loading) return <ModernLoader />;
  if (!isLogin) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="practice" />
      <Tabs.Screen name="revision" />
      <Tabs.Screen name="topic-test" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
