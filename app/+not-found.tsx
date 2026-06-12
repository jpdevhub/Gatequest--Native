import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function NotFound() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 'bold' }}>Page not found</Text>
      <Link href="/" style={{ color: '#3470f9', fontSize: 16 }}>Go home</Link>
    </View>
  );
}
