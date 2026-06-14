import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  Pi, Binary, Cpu, Graph, GitBranch, FileCode, Calculator, LinuxLogo, Code, Database, Globe,
  TreeStructure, Bicycle, Brain, TerminalWindow, Flame, Lightbulb, AppWindow, Browsers,
  HeadCircuit, Pulse, WaveSine, Sliders, Broadcast, Magnet, Gauge, PlugCharging, Power,
  Waveform, Wrench, Waves, Factory, Books,
} from 'phosphor-react-native';
import type { SubjectStat } from '@/shared/types/Stats';

const IconMap: Record<string, React.ElementType> = {
  pi: Pi, binary: Binary, cpu: Cpu, graph: Graph, gitbranch: GitBranch,
  filecode: FileCode, calculator: Calculator, linuxlogo: LinuxLogo, code: Code,
  database: Database, globe: Globe, 'tree-structure': TreeStructure, bicycle: Bicycle,
  brain: Brain, terminal: TerminalWindow, flame: Flame, zap: Lightbulb,
  appwindow: AppWindow, browsers: Browsers, headcircuit: HeadCircuit, pulse: Pulse,
  wavesine: WaveSine, sliders: Sliders, broadcast: Broadcast, magnet: Magnet,
  gauge: Gauge, plugcharging: PlugCharging, power: Power, waveform: Waveform,
  wrench: Wrench, waves: Waves, factory: Factory, default: Books,
};

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue:    { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  green:   { bg: 'rgba(34,197,94,0.15)',  text: '#4ade80' },
  purple:  { bg: 'rgba(168,85,247,0.15)', text: '#c084fc' },
  orange:  { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
  red:     { bg: 'rgba(239,68,68,0.15)',  text: '#f87171' },
  yellow:  { bg: 'rgba(234,179,8,0.15)',  text: '#facc15' },
  cyan:    { bg: 'rgba(6,182,212,0.15)',   text: '#22d3ee' },
  pink:    { bg: 'rgba(236,72,153,0.15)', text: '#f472b6' },
  indigo:  { bg: 'rgba(99,102,241,0.15)', text: '#818cf8' },
  amber:   { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  teal:    { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf' },
  emerald: { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
  rose:    { bg: 'rgba(244,63,94,0.15)',  text: '#fb7185' },
  sky:     { bg: 'rgba(14,165,233,0.15)', text: '#38bdf8' },
  gray:    { bg: 'rgba(100,116,139,0.15)',text: '#94a3b8' },
};

type Props = { subjectStats: SubjectStat[] };

export default function SubjectStats({ subjectStats }: Props) {
  return (
    <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.wrapper}>
      <Text style={styles.heading}>Subject Stats</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {subjectStats.map((s, i) => {
            const progress = Number(s.progress) || 0;
            const accuracy = Number(s.accuracy) || 0;
            const Icon = IconMap[s.icon_name || 'default'] as any;
            const theme = COLOR_MAP[s.theme_color || 'gray'] || COLOR_MAP.gray;

            return (
              <Pressable key={i} style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: theme.bg }]}>
                  <Icon size={22} color={theme.text} weight="duotone" />
                </View>
                <Text style={styles.subjectName}>{s.subjectName}</Text>

                <Text style={styles.barLabel}>Progress</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${progress}%`, backgroundColor: '#3b82f6' }]} />
                </View>
                <Text style={styles.barHint}>{progress}% complete</Text>

                <Text style={styles.barLabel}>Accuracy</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${accuracy}%`, backgroundColor: '#22c55e' }]} />
                </View>
                <Text style={styles.barHint}>{accuracy}% correct</Text>

                <View style={styles.meta}>
                  <Text style={styles.metaText}>Attempted: <Text style={styles.bold}>{s.attempted}</Text></Text>
                  <Text style={styles.metaText}>Total: <Text style={styles.bold}>{s.totalAvailable ?? '—'}</Text></Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  heading: { color: '#f1f5f9', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  card: {
    width: 220,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  subjectName: { color: '#f1f5f9', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  barLabel: { color: '#94a3b8', fontSize: 11, marginBottom: 4 },
  track: { height: 6, backgroundColor: '#334155', borderRadius: 99, overflow: 'hidden', marginBottom: 2 },
  fill: { height: 6, borderRadius: 99 },
  barHint: { color: '#64748b', fontSize: 10, marginBottom: 10 },
  meta: { marginTop: 4, gap: 2 },
  metaText: { color: '#64748b', fontSize: 11 },
  bold: { color: '#94a3b8', fontWeight: '700' },
});
