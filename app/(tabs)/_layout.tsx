import { Tabs, Redirect } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { ModernLoader } from '@/shared/components/ModernLoader';

function TabIcon({ label, color }: { label: string; color: ColorValue }) {
  const map: Record<string, string> = {
    dashboard: '🏠', practice: '📚', revision: '🔄', 'topic-test': '📝',
  };
  return <Text style={{ fontSize: 20 }}>{map[label] ?? '•'}</Text>;
}

export default function TabLayout() {
  const { isLogin, loading } = useAuth();

  if (loading) return <ModernLoader />;
  if (!isLogin) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
        tabBarActiveTintColor: '#3470f9',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <TabIcon label="dashboard" color={color} /> }} />
      <Tabs.Screen name="practice"  options={{ title: 'Practice',  tabBarIcon: ({ color }) => <TabIcon label="practice"  color={color} /> }} />
      <Tabs.Screen name="revision"  options={{ title: 'Revision',  tabBarIcon: ({ color }) => <TabIcon label="revision"  color={color} /> }} />
      <Tabs.Screen name="topic-test" options={{ title: 'Topic Test', tabBarIcon: ({ color }) => <TabIcon label="topic-test" color={color} /> }} />
    </Tabs>
  );
}
