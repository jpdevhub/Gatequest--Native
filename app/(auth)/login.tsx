import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Login screen — Google OAuth entry point.
 * TODO: Wire up expo-auth-session for native Google Sign-In flow.
 * The PWA uses signInWithIdToken; native needs a different approach.
 */
export default function LoginScreen() {
  const { handleGoogleLogin, loading } = useAuth();

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>GATEQuest</Text>
      <Text style={s.subtitle}>GATE preparation, simplified.</Text>
      <TouchableOpacity style={s.button} onPress={handleGoogleLogin} disabled={loading}>
        <Text style={s.buttonText}>{loading ? 'Signing in…' : 'Continue with Google'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  title: { color: '#f1f5f9', fontSize: 36, fontWeight: 'bold' },
  subtitle: { color: '#94a3b8', fontSize: 16 },
  button: { backgroundColor: '#3470f9', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
