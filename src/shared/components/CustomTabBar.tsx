import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import {
  ChartPieSlice,
  BookOpen,
  Gear,
  Info,
} from 'phosphor-react-native';

const ICONS: Record<string, { inactive: React.ReactNode; active: React.ReactNode }> = {
  dashboard: {
    inactive: <ChartPieSlice size={22} color="#64748b" weight="duotone" />,
    active:   <ChartPieSlice size={22} color="#3b82f6" weight="fill" />,
  },
  practice: {
    inactive: <BookOpen size={22} color="#64748b" weight="duotone" />,
    active:   <BookOpen size={22} color="#3b82f6" weight="fill" />,
  },
  settings: {
    inactive: <Gear size={22} color="#64748b" weight="duotone" />,
    active:   <Gear size={22} color="#3b82f6" weight="fill" />,
  },
  about: {
    inactive: <Info size={22} color="#64748b" weight="duotone" />,
    active:   <Info size={22} color="#3b82f6" weight="fill" />,
  },
};

function TabItem({
  route,
  isFocused,
  onPress,
}: {
  route: { name: string; key: string };
  isFocused: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const handlePress = () => {
    // Dashboard: rotate on activate (like PWA's -45deg spring)
    if (route.name === 'dashboard') {
      rotate.value = withSpring(isFocused ? 0 : -45, { stiffness: 300, damping: 15 });
    }
    // Practice / Settings: flip
    if (route.name === 'practice' || route.name === 'revision' || route.name === 'topic-test') {
      scale.value = withSpring(1.2, { stiffness: 300, damping: 12 }, () => {
        scale.value = withSpring(1);
      });
    }
    onPress();
  };

  const icons = ICONS[route.name] || ICONS.dashboard;

  return (
    <Pressable onPress={handlePress} style={styles.tab}>
      <Animated.View style={[styles.iconWrap, animStyle, isFocused && styles.iconWrapActive]}>
        {isFocused ? icons.active : icons.inactive}
      </Animated.View>
      <Text style={[styles.label, isFocused && styles.labelActive]}>
        {route.name.charAt(0).toUpperCase() + route.name.slice(1).replace('-', ' ')}
      </Text>
      {isFocused && <View style={styles.dot} />}
    </Pressable>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <BlurView intensity={60} tint="dark" style={styles.blur}>
        <View style={styles.bar}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };
            return (
              <TabItem key={route.key} route={route} isFocused={isFocused} onPress={onPress} />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  blur: { borderRadius: 20 },
  bar: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconWrap: { padding: 6, borderRadius: 12 },
  iconWrapActive: { backgroundColor: 'rgba(59,130,246,0.12)' },
  label: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  labelActive: { color: '#3b82f6' },
  dot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
  },
});
