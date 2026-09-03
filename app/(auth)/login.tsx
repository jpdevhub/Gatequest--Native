import {
    Brain,
    ChartLineUp,
    CheckCircle,
    Exam,
    Lightning,
} from 'phosphor-react-native';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { md } from '@/shared/theme/material';

const { width } = Dimensions.get('window');

type Slide = {
    key: string;
    Icon: React.ElementType;
    title: string;
    body: string;
    bullets: string[];
};

const SLIDES: Slide[] = [
    {
        key: 'practice',
        Icon: Brain,
        title: 'Every GATE question,\norganised',
        body: 'Thousands of past questions sorted by subject and topic, with full solutions.',
        bullets: ['Filter by topic, year and difficulty', 'Works offline once loaded'],
    },
    {
        key: 'tests',
        Icon: Exam,
        title: 'Timed tests that\nmirror the real paper',
        body: 'Build a test from the topics you choose, with negative marking and a question palette.',
        bullets: ['Pick your weak topics', 'See exactly where your time went'],
    },
    {
        key: 'progress',
        Icon: ChartLineUp,
        title: 'Revision that targets\nyour mistakes',
        body: 'Questions you get wrong come back at the right time, so weak areas actually close.',
        bullets: ['Weekly smart revision sets', 'Streaks, accuracy and subject breakdowns'],
    },
];

function GoogleMark() {
    return (
        <View style={s.googleMark}>
            <Text style={s.googleMarkText}>G</Text>
        </View>
    );
}

function SlideView({ slide }: { slide: Slide }) {
    const { Icon } = slide;
    return (
        <View style={[s.slide, { width }]}>
            <Animated.View entering={FadeIn.duration(320)} style={s.iconWrap}>
                <Icon size={44} color={md.color.primary} weight="duotone" />
            </Animated.View>

            <Text style={s.slideTitle}>{slide.title}</Text>
            <Text style={s.slideBody}>{slide.body}</Text>

            <View style={s.bullets}>
                {slide.bullets.map((bullet) => (
                    <View key={bullet} style={s.bulletRow}>
                        <CheckCircle size={17} color={md.color.success} weight="fill" />
                        <Text style={s.bulletText}>{bullet}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

export default function LoginScreen() {
    const { handleGoogleLogin, loading } = useAuth();
    const listRef = useRef<FlatList<Slide>>(null);
    const [index, setIndex] = useState(0);

    const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const next = Math.round(e.nativeEvent.contentOffset.x / width);
        setIndex(next);
    }, []);

    const isLast = index === SLIDES.length - 1;

    const goNext = () => {
        if (isLast) return;
        listRef.current?.scrollToOffset({ offset: (index + 1) * width, animated: true });
    };

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
                <Text style={s.brand}>GATEQuest</Text>
                <View style={s.headerSpacer} />
                {!isLast && (
                    <Pressable
                        onPress={() =>
                            listRef.current?.scrollToOffset({
                                offset: (SLIDES.length - 1) * width,
                                animated: true,
                            })
                        }
                        hitSlop={10}
                        style={s.skip}
                    >
                        <Text style={s.skipText}>Skip</Text>
                    </Pressable>
                )}
            </View>

            <FlatList
                ref={listRef}
                data={SLIDES}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => <SlideView slide={item} />}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                style={s.pager}
            />

            <View style={s.dots}>
                {SLIDES.map((slide, i) => (
                    <View key={slide.key} style={[s.dot, i === index && s.dotActive]} />
                ))}
            </View>

            <Animated.View entering={FadeInDown.duration(360)} style={s.footer}>
                {isLast ? (
                    <Pressable
                        style={({ pressed }) => [s.cta, pressed && s.ctaPressed, loading && s.ctaDisabled]}
                        onPress={handleGoogleLogin}
                        disabled={loading}
                        android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
                    >
                        {loading ? (
                            <ActivityIndicator color={md.color.onPrimary} size="small" />
                        ) : (
                            <>
                                <GoogleMark />
                                <Text style={s.ctaText}>Continue with Google</Text>
                            </>
                        )}
                    </Pressable>
                ) : (
                    <Pressable
                        style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
                        onPress={goNext}
                        android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
                    >
                        <Text style={s.ctaText}>Next</Text>
                        <Lightning size={18} color={md.color.onPrimary} weight="fill" />
                    </Pressable>
                )}

                <Text style={s.terms}>
                    By continuing you agree to our Terms of Service and Privacy Policy.
                </Text>
            </Animated.View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: md.color.surface },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.sm,
        paddingHorizontal: md.space.xl,
        height: 64,
    },
    logo: { width: 28, height: 28 },
    brand: { ...md.type.titleMedium, color: md.color.onSurface },
    headerSpacer: { flex: 1 },
    skip: { padding: md.space.sm },
    skipText: { ...md.type.labelLarge, color: md.color.onSurfaceVariant },

    pager: { flexGrow: 0 },
    slide: {
        paddingHorizontal: md.space.xl,
        paddingTop: md.space.xxl,
        gap: md.space.lg,
    },
    iconWrap: {
        width: 88,
        height: 88,
        borderRadius: md.radius.lg,
        backgroundColor: md.color.surfaceContainerHigh,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: md.space.sm,
    },
    slideTitle: {
        fontSize: 30,
        lineHeight: 38,
        fontWeight: '700',
        color: md.color.onSurface,
        letterSpacing: -0.5,
    },
    slideBody: { ...md.type.bodyLarge, color: md.color.onSurfaceVariant },
    bullets: { gap: md.space.md, marginTop: md.space.sm },
    bulletRow: { flexDirection: 'row', alignItems: 'center', gap: md.space.md },
    bulletText: { ...md.type.bodyMedium, color: md.color.onSurface, flex: 1 },

    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: md.space.sm,
        paddingVertical: md.space.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: md.color.surfaceContainerHighest,
    },
    dotActive: { backgroundColor: md.color.primary, width: 24 },

    footer: {
        paddingHorizontal: md.space.xl,
        paddingBottom: md.space.xl,
        gap: md.space.md,
        marginTop: 'auto',
    },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: md.space.md,
        height: 56,
        borderRadius: md.radius.full,
        backgroundColor: md.color.primary,
        overflow: 'hidden',
    },
    ctaPressed: { opacity: 0.9 },
    ctaDisabled: { opacity: 0.6 },
    ctaText: { ...md.type.titleMedium, color: md.color.onPrimary },
    googleMark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleMarkText: { color: '#1a73e8', fontWeight: '800', fontSize: 14 },
    terms: {
        ...md.type.bodySmall,
        color: md.color.onSurfaceVariant,
        textAlign: 'center',
    },
});
