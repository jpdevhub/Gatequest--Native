import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import {
  Brain,
  ChartPieSlice,
  Lightning,
  Cloud,
  Bookmark,
  Trophy,
} from 'phosphor-react-native';
import { useAuth } from '@/providers/AuthProvider';

const { width } = Dimensions.get('window');

const FEATURES = [
  { Icon: Brain, title: 'Master Every Topic', desc: 'Thousands of questions sorted by subject.' },
  { Icon: ChartPieSlice, title: 'Track Progress', desc: 'Streaks, accuracy, and performance at a glance.' },
  { Icon: Lightning, title: 'Fast & Focused', desc: 'Smooth, distraction-free practice interface.' },
  { Icon: Cloud, title: 'Sync Everywhere', desc: 'Progress follows you across all your devices.' },
  { Icon: Bookmark, title: 'Bookmark Questions', desc: 'Save key questions for focused revision.' },
  { Icon: Trophy, title: 'Gamified Streaks', desc: 'Stay motivated with streaks and achievements.' },
];

function GoogleIcon() {
  return (
    <View style={s.googleIconWrap}>
      <Text style={s.googleIconG}>G</Text>
    </View>
  );
}

function FeatureCard({ Icon, title, desc, index }: { Icon: any; title: string; desc: string; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(400 + index * 60).springify()} style={s.featureCard}>
      <View style={s.featureIconWrap}>
        <Icon size={20} weight="bold" color="#3b82f6" />
      </View>
      <View style={s.featureText}>
        <Text style={s.featureTitle}>{title}</Text>
        <Text style={s.featureDesc}>{desc}</Text>
      </View>
    </Animated.View>
  );
}

function PulsingOrb({ delay = 0, size = 200, top = 0, left = 0, color = 'rgba(37,99,235,0.18)' }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withDelay(delay, withRepeat(withTiming(1.25, { duration: 3000, easing: Easing.inOut(Easing.sin) }), -1, true));
    opacity.value = withDelay(delay, withRepeat(withTiming(0.15, { duration: 3000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
        },
        style,
      ]}
    />
  );
}

export default function LoginScreen() {
  const { handleGoogleLogin, loading } = useAuth();

  return (
    <View style={s.root}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill}>
        <PulsingOrb size={340} top={-80} left={width / 2 - 170} color="rgba(37,99,235,0.22)" delay={0} />
        <PulsingOrb size={200} top={120} left={-60} color="rgba(99,102,241,0.15)" delay={800} />
        <PulsingOrb size={160} top={320} left={width - 100} color="rgba(59,130,246,0.12)" delay={1400} />
      </View>

      <SafeAreaView style={s.safeArea}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero section */}
          <Animated.View entering={FadeInDown.delay(0).springify()} style={s.hero}>
            <Image
              source={require('../../assets/logo.png')}
              style={s.logo}
              resizeMode="contain"
            />
            <Text style={s.appName}>GATEQuest</Text>
            <Text style={s.tagline}>Precision Practice for Peak{'\n'}GATE Performance</Text>
            <Text style={s.sub}>
              The open-source platform with a massive question bank, real-time analytics, and a
              modern, distraction-free interface.
            </Text>
          </Animated.View>

          {/* CTA button */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={s.ctaWrap}>
            <TouchableOpacity
              style={[s.googleBtn, loading && s.googleBtnDisabled]}
              onPress={handleGoogleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <GoogleIcon />
                  <Text style={s.googleBtnText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={s.termsText}>
              By continuing, you agree to our{' '}
              <Text style={s.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={s.termsLink}>Privacy Policy</Text>
            </Text>
          </Animated.View>

          {/* Divider */}
          <Animated.View entering={FadeInUp.delay(280).springify()} style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>Features</Text>
            <View style={s.dividerLine} />
          </Animated.View>

          {/* Feature cards */}
          <View style={s.featuresGrid}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} index={i} Icon={f.Icon} title={f.title} desc={f.desc} />
            ))}
          </View>

          {/* Footer */}
          <Animated.View entering={FadeInUp.delay(600).springify()} style={s.footer}>
            <Text style={s.footerText}>© {new Date().getFullYear()} GATEQuest. All Rights Reserved.</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080f1e',
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 12,
  },
  taglineAccent: {
    color: '#3b82f6',
  },
  sub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },

  // CTA
  ctaWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 28,
    width: '100%',
    gap: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconG: {
    color: '#1d4ed8',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 18,
  },
  googleBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  termsText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
  termsLink: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e293b',
  },
  dividerText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Feature cards
  featuresGrid: {
    width: '100%',
    gap: 10,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(51,65,85,0.5)',
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  featureDesc: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    color: '#334155',
    fontSize: 12,
  },
});
