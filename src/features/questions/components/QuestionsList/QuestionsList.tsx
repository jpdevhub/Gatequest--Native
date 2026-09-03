/**
 * QuestionsList — the shared question browser used by Practice and Smart Revision.
 * Mirrors the PWA's QuestionsList: search, attempt filter, faceted filters, and
 * a virtualised list of question previews.
 */
import { FlashList } from '@shopify/flash-list';
import { ArrowLeft, BookmarkSimple, Funnel, MagnifyingGlass, X } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toPlainText } from '@/shared/components/renderers/contentHtml';
import type { Question, RevisionQuestion } from '@/shared/types/storage';
import { normalizeTag } from '@/shared/utils/helper';
import useFilters, { type AttemptFilterMode } from '../../hooks/useFilters';
import { getDifficultyColors, getDifficultyDisplayText } from '../../utils/questionUtils';
import FilterSheet from './FilterSheet';

const ATTEMPT_TABS: { id: AttemptFilterMode; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unattempted', label: 'Unattempted' },
    { id: 'attempted', label: 'Attempted' },
    { id: 'bookmarked', label: 'Bookmarked' },
];

// Question text is markup-heavy; previews strip it down to readable prose.
function preview(text: string): string {
    return toPlainText(text)
        .replace(/```[\s\S]*?```/g, ' [code] ')
        .replace(/!\[.*?\]\(.*?\)/g, ' [image] ')
        .replace(/\$\$?([^$]*)\$?\$/g, '$1')
        .replace(/\\[a-zA-Z]+/g, ' ')
        .replace(/[{}\\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

type QuestionsListProps = {
    questions: Question[] | RevisionQuestion[];
    title: string;
    subtitle?: string;
    subjectSlug: string | null;
    mode: 'practice' | 'revision';
    isLoading?: boolean;
    availableExams?: string[];
    onQuestionPress: (id: string, list: Question[]) => void;
    onBack: () => void;
};

export default function QuestionsList({
    questions,
    title,
    subtitle,
    subjectSlug,
    mode,
    isLoading,
    availableExams = [],
    onQuestionPress,
    onBack,
}: QuestionsListProps) {
    const [showFilters, setShowFilters] = useState(false);

    const filters = useFilters(questions, subjectSlug, null, mode);

    const facets = useMemo(() => {
        const years = new Set<string>();
        const topics = new Set<string>();
        const tags = new Set<string>();
        for (const q of questions) {
            if (q.year) years.add(String(q.year));
            if (q.topic) topics.add(q.topic);
            q.tags?.forEach((t) => tags.add(normalizeTag(t)));
        }
        return {
            years: [...years].sort((a, b) => Number(b) - Number(a)),
            topics: [...topics].sort(),
            tags: [...tags].filter(Boolean).sort().slice(0, 40),
        };
    }, [questions]);

    const toggle = (
        value: string,
        selected: string[],
        setter: (next: string[]) => void
    ) => setter(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

    const activeFilterCount =
        filters.difficultyFilter.length +
        filters.yearFilter.length +
        filters.topicFilter.length +
        filters.examFilter.length +
        filters.tagFilter.length;

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <View style={s.header}>
                <Pressable onPress={onBack} style={s.backBtn} hitSlop={10}>
                    <ArrowLeft size={20} color="#94a3b8" weight="bold" />
                </Pressable>
                <View style={s.headerText}>
                    <Text style={s.title} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={s.subtitle}>
                        {subtitle ?? `${filters.filteredQuestions.length} of ${questions.length} questions`}
                    </Text>
                </View>
            </View>

            <View style={s.searchRow}>
                <View style={s.searchBox}>
                    <MagnifyingGlass size={16} color="#64748b" />
                    <TextInput
                        value={filters.searchQuery}
                        onChangeText={filters.setSearchQuery}
                        placeholder="Search questions and tags"
                        placeholderTextColor="#475569"
                        style={s.searchInput}
                        returnKeyType="search"
                    />
                    {filters.searchQuery.length > 0 && (
                        <Pressable onPress={() => filters.setSearchQuery('')} hitSlop={10}>
                            <X size={15} color="#64748b" />
                        </Pressable>
                    )}
                </View>
                <Pressable
                    style={[s.filterBtn, activeFilterCount > 0 && s.filterBtnActive]}
                    onPress={() => setShowFilters(true)}
                >
                    <Funnel
                        size={17}
                        color={activeFilterCount > 0 ? '#60a5fa' : '#94a3b8'}
                        weight={activeFilterCount > 0 ? 'fill' : 'regular'}
                    />
                    {activeFilterCount > 0 && <Text style={s.filterCount}>{activeFilterCount}</Text>}
                </Pressable>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.tabsScroll}
                contentContainerStyle={s.tabsRow}
            >
                {ATTEMPT_TABS.map((tab) => {
                    const active = filters.attemptFilter === tab.id;
                    return (
                        <Pressable
                            key={tab.id}
                            style={[s.tab, active && s.tabActive]}
                            onPress={() => filters.setAttemptFilter(tab.id)}
                        >
                            {tab.id === 'bookmarked' && (
                                <BookmarkSimple
                                    size={13}
                                    color={active ? '#60a5fa' : '#64748b'}
                                    weight={active ? 'fill' : 'regular'}
                                />
                            )}
                            <Text style={[s.tabText, active && s.tabTextActive]}>{tab.label}</Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {isLoading && questions.length === 0 ? (
                <View style={s.loading}>
                    <ActivityIndicator color="#3b82f6" />
                </View>
            ) : (
                <FlashList
                    data={filters.filteredQuestions}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 30).duration(280)}>
                            <Pressable
                                style={({ pressed }) => [s.card, pressed && s.cardPressed]}
                                onPress={() =>
                                    onQuestionPress(item.id, filters.filteredQuestions as Question[])
                                }
                            >
                                <Text style={s.cardText} numberOfLines={3}>
                                    {preview(item.question)}
                                </Text>
                                <View style={s.cardFooter}>
                                    <View
                                        style={[
                                            s.diffBadge,
                                            { backgroundColor: getDifficultyColors(item.difficulty).bg },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                s.diffText,
                                                { color: getDifficultyColors(item.difficulty).text },
                                            ]}
                                        >
                                            {getDifficultyDisplayText(item.difficulty)}
                                        </Text>
                                    </View>
                                    <Text style={s.cardMeta}>
                                        {item.topic ? `${item.topic} · ` : ''}
                                        {item.year}
                                    </Text>
                                </View>
                            </Pressable>
                        </Animated.View>
                    )}
                    ListEmptyComponent={
                        <Animated.View entering={FadeIn.duration(300)} style={s.empty}>
                            <Text style={s.emptyText}>
                                No questions match these filters.
                            </Text>
                            <Pressable style={s.emptyBtn} onPress={filters.resetFilters}>
                                <Text style={s.emptyBtnText}>Clear filters</Text>
                            </Pressable>
                        </Animated.View>
                    }
                />
            )}

            <FilterSheet
                visible={showFilters}
                onClose={() => setShowFilters(false)}
                onReset={filters.resetFilters}
                resultCount={filters.filteredQuestions.length}
                groups={[
                    {
                        key: 'difficulty',
                        label: 'Difficulty',
                        options: ['Easy', 'Medium', 'Hard'],
                        selected: filters.difficultyFilter,
                        onToggle: (v) =>
                            toggle(v, filters.difficultyFilter, filters.setDifficultyFilter),
                    },
                    {
                        key: 'exam',
                        label: 'Exam',
                        options: availableExams,
                        selected: filters.examFilter,
                        onToggle: (v) => toggle(v, filters.examFilter, filters.setExamFilter),
                    },
                    {
                        key: 'topic',
                        label: 'Topic',
                        options: facets.topics,
                        selected: filters.topicFilter,
                        onToggle: (v) => toggle(v, filters.topicFilter, filters.setTopicFilter),
                    },
                    {
                        key: 'year',
                        label: 'Year',
                        options: facets.years,
                        selected: filters.yearFilter,
                        onToggle: (v) => toggle(v, filters.yearFilter, filters.setYearFilter),
                    },
                    {
                        key: 'tag',
                        label: 'Tags',
                        options: facets.tags,
                        selected: filters.tagFilter,
                        onToggle: (v) => toggle(v, filters.tagFilter, filters.setTagFilter),
                    },
                ]}
            />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0f172a' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
    backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
    headerText: { flex: 1 },
    title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
    subtitle: { color: '#475569', fontSize: 12, marginTop: 2 },

    searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
    searchBox: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 12, height: 44,
        borderWidth: 1, borderColor: '#1e293b',
    },
    searchInput: { flex: 1, color: '#e2e8f0', fontSize: 14, padding: 0 },
    filterBtn: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#1e293b',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3,
        borderWidth: 1, borderColor: '#1e293b',
    },
    filterBtnActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.14)' },
    filterCount: { color: '#60a5fa', fontSize: 11, fontWeight: '700' },

    tabsScroll: { flexGrow: 0, flexShrink: 0 },
    tabsRow: { paddingHorizontal: 16, paddingVertical: 6, gap: 8, flexDirection: 'row', alignItems: 'center' },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b',
    },
    tabActive: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' },
    tabText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#60a5fa' },

    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110 },
    card: {
        backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: '#243449',
    },
    cardPressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
    cardText: { color: '#e2e8f0', fontSize: 14, lineHeight: 21, marginBottom: 14 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    diffBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    diffText: { fontSize: 11, fontWeight: '700' },
    cardMeta: { color: '#64748b', fontSize: 11, flexShrink: 1, textAlign: 'right' },

    empty: { alignItems: 'center', paddingTop: 60, gap: 14 },
    emptyText: { color: '#475569', fontSize: 14 },
    emptyBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1e293b' },
    emptyBtnText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
});
