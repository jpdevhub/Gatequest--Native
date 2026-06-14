import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, BookmarkSimple } from 'phosphor-react-native';
import { useState, useMemo } from 'react';

import { useGoals, type Subject } from '@/providers/GoalProvider';
import {
  Pi, Binary, Cpu, Graph, GitBranch, FileCode, Calculator, LinuxLogo, Code,
  Database, Globe, TreeStructure, Bicycle, Brain, TerminalWindow, Flame,
  Lightbulb, AppWindow, Browsers, HeadCircuit, Pulse, WaveSine, Sliders,
  Broadcast, Magnet, Gauge, PlugCharging, Power, Waveform, Wrench, Waves,
  Factory, Books,
} from 'phosphor-react-native';

// ── Icon map (same as PWA SubjectIconMap) ─────────────────────────────────
const IconMap: Record<string, any> = {
  pi: Pi, binary: Binary, cpu: Cpu, graph: Graph, gitbranch: GitBranch,
  filecode: FileCode, calculator: Calculator, linuxlogo: LinuxLogo, code: Code,
  database: Database, globe: Globe, 'tree-structure': TreeStructure, bicycle: Bicycle,
  brain: Brain, terminal: TerminalWindow, flame: Flame, zap: Lightbulb,
  appwindow: AppWindow, browsers: Browsers, headcircuit: HeadCircuit, pulse: Pulse,
  wavesine: WaveSine, sliders: Sliders, broadcast: Broadcast, magnet: Magnet,
  gauge: Gauge, plugcharging: PlugCharging, power: Power, waveform: Waveform,
  wrench: Wrench, waves: Waves, factory: Factory, default: Books,
};

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  blue:    { bg: 'rgba(59,130,246,0.15)',   icon: '#60a5fa' },
  green:   { bg: 'rgba(34,197,94,0.15)',    icon: '#4ade80' },
  purple:  { bg: 'rgba(168,85,247,0.15)',   icon: '#c084fc' },
  orange:  { bg: 'rgba(249,115,22,0.15)',   icon: '#fb923c' },
  red:     { bg: 'rgba(239,68,68,0.15)',    icon: '#f87171' },
  yellow:  { bg: 'rgba(234,179,8,0.15)',    icon: '#facc15' },
  cyan:    { bg: 'rgba(6,182,212,0.15)',    icon: '#22d3ee' },
  amber:   { bg: 'rgba(245,158,11,0.15)',   icon: '#fbbf24' },
  teal:    { bg: 'rgba(20,184,166,0.15)',   icon: '#2dd4bf' },
  indigo:  { bg: 'rgba(99,102,241,0.15)',   icon: '#818cf8' },
  rose:    { bg: 'rgba(244,63,94,0.15)',    icon: '#fb7185' },
  gray:    { bg: 'rgba(100,116,139,0.15)',  icon: '#94a3b8' },
};

const DIFF_COLORS: Record<string, { bg: string; text: string }> = {
  Easy:   { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
  Medium: { bg: 'rgba(234,179,8,0.15)',   text: '#facc15' },
  Hard:   { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
};

// ── Filter tabs ────────────────────────────────────────────────────────────
type FilterId = 'all' | 'core' | 'math' | 'aptitude' | 'bookmarked';

function buildTabs(branchId?: string): { id: FilterId; label: string }[] {
  return [
    { id: 'all',        label: 'All Subjects' },
    { id: 'core',       label: `Core ${(branchId ?? 'CS').toUpperCase()}` },
    { id: 'math',       label: 'Mathematics' },
    { id: 'aptitude',   label: 'Aptitude' },
    { id: 'bookmarked', label: 'Bookmarked' },
  ];
}

// ── Subject card ───────────────────────────────────────────────────────────
function SubjectCard({ subject, index, isBookmark }: { subject: Subject; index: number; isBookmark: boolean }) {
  const router = useRouter();
  const Icon = IconMap[(subject.icon_name as string) || 'default'];
  const theme = COLOR_MAP[(subject.theme_color as string) || 'gray'] || COLOR_MAP.gray;
  const diff = subject.difficulty as string | undefined;
  const diffStyle = DIFF_COLORS[diff ?? 'Medium'] || DIFF_COLORS.Medium;

  const handlePress = () => {
    router.push(`/(tabs)/practice/${subject.slug}?bookmarked=${isBookmark}` as any);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <Pressable style={styles.card} onPress={handlePress}>
        <View style={styles.cardTop}>
          {/* Icon + name */}
          <View style={styles.cardLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.bg }]}>
              <Icon size={22} color={theme.icon} weight="duotone" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{subject.name}</Text>
              {diff && (
                <View style={[styles.badge, { backgroundColor: diffStyle.bg }]}>
                  <Text style={[styles.badgeText, { color: diffStyle.text }]}>{diff}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Progress bar — always 0 (no questions yet) */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '0%' }]} />
        </View>
        <Text style={styles.progressLabel}>Progress: 0%</Text>

        {/* CTA */}
        <Pressable style={styles.btn} onPress={handlePress}>
          <Text style={styles.btnText}>{isBookmark ? 'View Bookmarks' : 'Start Practice'}</Text>
          <ArrowRight size={15} color="#fff" weight="bold" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function PracticeScreen() {
  const { userGoal, getPracticeSubjects, loading } = useGoals();
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  const tabs = useMemo(() => buildTabs(userGoal?.branch_id), [userGoal]);

  const subjects = useMemo(() => {
    const all = getPracticeSubjects();
    if (activeFilter === 'all' || activeFilter === 'bookmarked') return all;
    return all.filter((s) => s.category === activeFilter);
  }, [getPracticeSubjects, activeFilter]);

  const isBookmark = activeFilter === 'bookmarked';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
        <Text style={styles.headerTitle}>
          {isBookmark ? 'Your ' : 'Practice by '}
          <Text style={styles.headerAccent}>{isBookmark ? 'Bookmarks' : 'Subject'}</Text>
        </Text>
        <Text style={styles.headerSub}>
          {isBookmark
            ? 'Select a subject to view your saved questions.'
            : 'Select a subject and start practicing.'}
        </Text>
      </Animated.View>

      {/* Filter tabs — horizontally scrollable */}
      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={[styles.tab, activeFilter === tab.id && styles.tabActive]}
              onPress={() => setActiveFilter(tab.id)}
            >
              {tab.id === 'bookmarked' && (
                <BookmarkSimple
                  size={13}
                  color={activeFilter === tab.id ? '#3b82f6' : '#64748b'}
                  weight={activeFilter === tab.id ? 'fill' : 'regular'}
                />
              )}
              <Text style={[styles.tabText, activeFilter === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Subject list */}
      <FlatList
        data={subjects}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <SubjectCard subject={item} index={index} isBookmark={isBookmark} />
        )}
        ListEmptyComponent={
          !loading ? (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.empty}>
              <Text style={styles.emptyText}>
                {userGoal
                  ? 'No subjects found for this filter.'
                  : 'Set your goal in settings to see subjects.'}
              </Text>
            </Animated.View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { color: '#f1f5f9', fontSize: 28, fontWeight: '800' },
  headerAccent: { color: '#3b82f6' },
  headerSub: { color: '#64748b', fontSize: 13, marginTop: 4 },

  tabsRow: { paddingHorizontal: 20, paddingVertical: 4, gap: 8, flexDirection: 'row' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  tabActive: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' },
  tabText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#3b82f6' },

  list: { padding: 20, paddingBottom: 100, gap: 12 },

  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 6 },
  cardName: { color: '#f1f5f9', fontSize: 16, fontWeight: '600' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },

  progressTrack: { height: 5, backgroundColor: '#334155', borderRadius: 99, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: 5, backgroundColor: '#3b82f6', borderRadius: 99 },
  progressLabel: { color: '#64748b', fontSize: 11, marginBottom: 14 },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 12,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#475569', fontSize: 14, textAlign: 'center' },
});
