import { CaretDown, Check, Eraser, ListChecks } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Button from '@/shared/components/md/Button';
import { md } from '@/shared/theme/material';
import type { Topic } from '../hooks/useTopicTestGenerator';

/**
 * Topics with fewer than this many questions are collapsed into "Other topics".
 * Matches the PWA so both apps group the long tail the same way.
 */
const MINOR_TOPIC_THRESHOLD = 10;

type Props = {
    availableTopics: Topic[];
    selectedTopics: Topic[];
    isLoading: boolean;
    includeAttempted: boolean;
    onToggle: (topic: Topic) => void;
    onToggleAll: (topics: Topic[], select: boolean) => void;
};

const sameTopic = (a: Topic, b: Topic) => a.name === b.name && a.subjectId === b.subjectId;

export default function TopicsSelection({
    availableTopics,
    selectedTopics,
    isLoading,
    includeAttempted,
    onToggle,
    onToggleAll,
}: Props) {
    const [showMinor, setShowMinor] = useState(false);

    const { primary, minor } = useMemo(
        () => ({
            primary: availableTopics.filter((t) => t.questionCount >= MINOR_TOPIC_THRESHOLD),
            minor: availableTopics.filter((t) => t.questionCount < MINOR_TOPIC_THRESHOLD),
        }),
        [availableTopics]
    );

    const isSelected = (topic: Topic) => selectedTopics.some((t) => sameTopic(t, topic));
    const allSelected =
        availableTopics.length > 0 && availableTopics.every((t) => isSelected(t));

    const countFor = (t: Topic) => (includeAttempted ? t.questionCount : t.unattemptedCount);

    if (isLoading) {
        return (
            <View style={s.loading}>
                <ActivityIndicator color={md.color.primary} />
            </View>
        );
    }

    if (availableTopics.length === 0) {
        return <Text style={s.empty}>No topics available for this subject.</Text>;
    }

    return (
        <View style={s.wrap}>
            <View style={s.headerRow}>
                <Text style={s.sectionLabel}>SELECT TOPICS</Text>
                <View style={s.countChip}>
                    <Text style={s.countText}>{selectedTopics.length} selected</Text>
                </View>
            </View>

            <Button
                label={allSelected ? 'Deselect all' : 'Select all'}
                variant={allSelected ? 'outlined' : 'tonal'}
                onPress={() => onToggleAll(availableTopics, !allSelected)}
                icon={(c, size) =>
                    allSelected ? <Eraser size={size} color={c} /> : <ListChecks size={size} color={c} />
                }
                style={s.selectAll}
            />

            <View style={s.list}>
                {primary.map((topic) => {
                    const active = isSelected(topic);
                    return (
                        <Pressable
                            key={topic.name}
                            onPress={() => onToggle(topic)}
                            android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
                            style={[s.card, active && s.cardActive]}
                        >
                            <View style={s.cardText}>
                                <Text style={[s.topicName, active && s.topicNameActive]} numberOfLines={2}>
                                    {topic.name}
                                </Text>
                                <Text style={s.topicMeta}>
                                    {countFor(topic)}{' '}
                                    {includeAttempted ? 'total' : 'available'} questions
                                </Text>
                            </View>
                            <View style={[s.checkbox, active && s.checkboxActive]}>
                                {active && <Check size={14} color={md.color.onPrimary} weight="bold" />}
                            </View>
                        </Pressable>
                    );
                })}
            </View>

            {minor.length > 0 && (
                <View style={s.minorSection}>
                    <Pressable
                        onPress={() => setShowMinor((v) => !v)}
                        android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
                        style={s.minorToggle}
                    >
                        <Text style={s.minorToggleText}>Other topics ({minor.length})</Text>
                        <View style={showMinor ? s.caretUp : undefined}>
                            <CaretDown size={15} color={md.color.onSurfaceVariant} weight="bold" />
                        </View>
                    </Pressable>

                    {showMinor && (
                        <Animated.View entering={FadeIn.duration(160)} style={s.minorList}>
                            {minor.map((topic) => {
                                const active = isSelected(topic);
                                return (
                                    <Pressable
                                        key={topic.name}
                                        onPress={() => onToggle(topic)}
                                        android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
                                        style={[s.minorRow, active && s.minorRowActive]}
                                    >
                                        <Text style={s.minorName} numberOfLines={1}>
                                            {topic.name}
                                            <Text style={s.minorCount}>
                                                {'  '}
                                                {countFor(topic)}
                                            </Text>
                                        </Text>
                                        <Check
                                            size={14}
                                            weight="bold"
                                            color={active ? md.color.primary : 'transparent'}
                                        />
                                    </Pressable>
                                );
                            })}
                        </Animated.View>
                    )}
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { gap: md.space.md },
    loading: { paddingVertical: md.space.xxl, alignItems: 'center' },
    empty: {
        ...md.type.bodyMedium,
        color: md.color.onSurfaceVariant,
        textAlign: 'center',
        paddingVertical: md.space.xl,
    },

    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionLabel: {
        ...md.type.labelSmall,
        color: md.color.onSurfaceVariant,
        letterSpacing: 1,
    },
    countChip: {
        paddingHorizontal: md.space.md,
        paddingVertical: md.space.xs,
        borderRadius: md.radius.sm,
        backgroundColor: md.color.surfaceContainerHigh,
    },
    countText: { ...md.type.labelSmall, color: md.color.onSurfaceVariant },

    selectAll: { alignSelf: 'flex-start' },

    list: { gap: md.space.sm },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.md,
        minHeight: md.touchTarget + 8,
        paddingHorizontal: md.space.lg,
        paddingVertical: md.space.md,
        borderRadius: md.radius.md,
        backgroundColor: md.color.surfaceContainerLow,
        borderWidth: 1,
        borderColor: md.color.outlineVariant,
        overflow: 'hidden',
    },
    cardActive: { backgroundColor: md.color.primaryContainer, borderColor: md.color.primary },
    cardText: { flex: 1, gap: 2 },
    topicName: { ...md.type.titleSmall, color: md.color.onSurface },
    topicNameActive: { color: md.color.onPrimaryContainer },
    topicMeta: { ...md.type.bodySmall, color: md.color.onSurfaceVariant },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: md.radius.xs,
        borderWidth: 2,
        borderColor: md.color.outline,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: { backgroundColor: md.color.primary, borderColor: md.color.primary },

    minorSection: { gap: md.space.sm },
    minorToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.sm,
        alignSelf: 'flex-start',
        minHeight: md.touchTarget,
        paddingHorizontal: md.space.md,
        borderRadius: md.radius.sm,
    },
    minorToggleText: { ...md.type.labelLarge, color: md.color.onSurfaceVariant },
    caretUp: { transform: [{ rotate: '180deg' }] },
    minorList: { gap: md.space.xs },
    minorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: md.space.sm,
        minHeight: 44,
        paddingHorizontal: md.space.lg,
        paddingVertical: md.space.sm,
        borderRadius: md.radius.sm,
        backgroundColor: md.color.surfaceContainerLow,
        overflow: 'hidden',
    },
    minorRowActive: { backgroundColor: md.color.primaryContainer },
    minorName: { ...md.type.bodyMedium, color: md.color.onSurface, flex: 1 },
    minorCount: { color: md.color.onSurfaceVariant },
});
