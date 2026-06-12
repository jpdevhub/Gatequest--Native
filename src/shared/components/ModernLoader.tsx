import { ActivityIndicator, StyleSheet, View } from 'react-native';

export function ModernLoader() {
  return (
    <View style={s.container}>
      <ActivityIndicator size="large" color="#3470f9" />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
});
