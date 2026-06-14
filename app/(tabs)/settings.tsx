import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch,
  TextInput, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User, ShieldCheck, Faders, SignOut, Broom, SpinnerGap,
} from 'phosphor-react-native';
import { useState, useMemo, useEffect } from 'react';

import { useAuth } from '@/providers/AuthProvider';
import { useGoals } from '@/providers/GoalProvider';
import { getUserProfile, setUserProfile } from '@/shared/utils/helper';
import { useAppSettings } from '@/providers/AppSettingsProvider';

// ── Types ────────────────────────────────────────────────────────────────────
type TabId = 'account' | 'privacy' | 'app-settings';

// ── Reusable RowToggle ────────────────────────────────────────────────────────
function SettingRow({ label, value, onToggle, disabled = false }: {
  label: string; value: boolean; onToggle: () => void; disabled?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#334155', true: 'rgba(59,130,246,0.5)' }}
        thumbColor={value ? '#3b82f6' : '#64748b'}
        ios_backgroundColor="#334155"
      />
    </View>
  );
}

// ── Account Tab ───────────────────────────────────────────────────────────────
function AccountTab() {
  const user = getUserProfile();
  const { userGoal, branches, exams, branchExams, setInitialGoal, loading: goalsLoading } = useGoals();

  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [targetYear, setTargetYear] = useState(user?.targetYear ?? 2027);
  const [tempBranch, setTempBranch] = useState('');
  const [tempExams, setTempExams] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userGoal) {
      setTempBranch(userGoal.branch_id);
      setTempExams((userGoal.target_exams as string[]) || []);
    }
  }, [userGoal]);

  const availableExams = useMemo(() => {
    if (!tempBranch) return [];
    const validIds = branchExams.filter(be => be.branch_id === tempBranch).map(be => be.exam_id);
    return exams.filter(e => validIds.includes(e.id));
  }, [tempBranch, branchExams, exams]);

  const handleSave = async () => {
    if (tempExams.length === 0) { Alert.alert('Please select at least 1 exam.'); return; }
    setSaving(true);
    try {
      if (user) setUserProfile({ ...user, name, college, targetYear });
      if (tempBranch) await setInitialGoal(tempBranch, tempExams, true);
      Alert.alert('Saved!', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.tabContent}>
      {/* Avatar row */}
      <View style={styles.avatarRow}>
        <View style={styles.avatarBox}>
          {user?.avatar
            ? <Image source={{ uri: user.avatar }} style={styles.avatar} />
            : <User size={28} color="#64748b" weight="duotone" />}
        </View>
        <View>
          <Text style={styles.profileName}>{user?.name || 'Anonymous'} <Text style={styles.profileVersion}>• v{user?.version_number}</Text></Text>
          <Text style={styles.profileSub}>{user?.targetYear} Aspirant</Text>
          <Text style={styles.profileSub}>{user?.college}</Text>
        </View>
      </View>

      {/* Fields */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Your Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor="#64748b" placeholder="Your name" />
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput style={[styles.input, styles.inputDisabled]} value={user?.email || ''} editable={false} />
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>College / University</Text>
        <TextInput style={styles.input} value={college} onChangeText={setCollege} placeholderTextColor="#64748b" placeholder="Your institution" />
      </View>

      {/* Target year pills */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Target Year</Text>
        <View style={styles.pillRow}>
          {[2027, 2028, 2029].map(y => (
            <Pressable key={y} style={[styles.pill, targetYear === y && styles.pillActive]} onPress={() => setTargetYear(y)}>
              <Text style={[styles.pillText, targetYear === y && styles.pillTextActive]}>{y}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Branch pills */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Branch</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.pillRow}>
            {branches.map(b => (
              <Pressable key={b.id} style={[styles.pill, tempBranch === b.id && styles.pillActive]} onPress={() => { setTempBranch(b.id); setTempExams([]); }}>
                <Text style={[styles.pillText, tempBranch === b.id && styles.pillTextActive]}>{b.name as string}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Exam checkboxes */}
      {availableExams.length > 0 && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Exams (select multiple)</Text>
          <View style={styles.pillRow}>
            {availableExams.map(e => {
              const active = tempExams.includes(e.id);
              return (
                <Pressable key={e.id} style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setTempExams(prev => active ? prev.filter(id => id !== e.id) : [...prev, e.id])}>
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{(e as any).short_name || e.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving || goalsLoading}>
        {saving
          ? <SpinnerGap size={18} color="#fff" weight="bold" />
          : <Text style={styles.saveBtnText}>Save all changes</Text>}
      </Pressable>
    </View>
  );
}

// ── Privacy Tab ───────────────────────────────────────────────────────────────
function PrivacyTab() {
  const { logout } = useAuth();
  const user = getUserProfile();
  const { settings, updateSetting } = useAppSettings();

  const confirmClear = () => {
    Alert.alert(
      'Clear all data?',
      `This cannot be undone. You have used ${user?.version_number}/5 resets. You will be logged out.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  return (
    <View style={styles.tabContent}>
      <SettingRow label="Share My Progress & Ranking" value={settings.shareProgress ?? false} onToggle={() => updateSetting('shareProgress', !settings.shareProgress)} />
      <SettingRow label="Remain Anonymous" value={settings.dataCollection ?? false} onToggle={() => updateSetting('dataCollection', !settings.dataCollection)} />

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Data Management</Text>

      <View style={styles.btnRow}>
        {user && (user.version_number ?? 0) < 5 && (
          <Pressable style={styles.outlineBtn} onPress={confirmClear}>
            <Broom size={16} color="#94a3b8" weight="duotone" />
            <Text style={styles.outlineBtnText}>Clear Data</Text>
          </Pressable>
        )}
        <Pressable style={styles.dangerBtn} onPress={() => logout()}>
          <SignOut size={16} color="#fff" weight="bold" />
          <Text style={styles.dangerBtnText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── App Settings Tab ──────────────────────────────────────────────────────────
function AppSettingsTab() {
  const { settings, updateSetting } = useAppSettings();
  return (
    <View style={styles.tabContent}>
      <SettingRow label="Sound Effects" value={settings.sound} onToggle={() => updateSetting('sound', !settings.sound)} />
      <SettingRow label="Auto Timer" value={settings.autoTimer} onToggle={() => updateSetting('autoTimer', !settings.autoTimer)} />
      <SettingRow label="Dark Mode" value={settings.darkMode} onToggle={() => updateSetting('darkMode', !settings.darkMode)} />

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>App Information</Text>
      <View style={styles.infoRow}><Text style={styles.infoLabel}>Version</Text><Text style={styles.infoValue}>1.0.0</Text></View>
      <View style={styles.infoRow}><Text style={styles.infoLabel}>Platform</Text><Text style={styles.infoValue}>Android</Text></View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; Icon: any }[] = [
  { id: 'account',      label: 'Account',      Icon: User },
  { id: 'privacy',      label: 'Privacy & Data', Icon: ShieldCheck },
  { id: 'app-settings', label: 'App Settings', Icon: Faders },
];

export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<TabId>('account');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
        <Text style={styles.headerTitle}>Preferences & <Text style={styles.headerAccent}>Settings</Text></Text>
        <Text style={styles.headerSub}>Customize your GATE preparation experience</Text>
      </Animated.View>

      {/* Tab bar */}
      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <Pressable key={t.id} style={[styles.tab, active && styles.tabActive]} onPress={() => setActiveTab(t.id)}>
                <t.Icon size={15} color={active ? '#3b82f6' : '#64748b'} weight={active ? 'fill' : 'duotone'} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Content */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          {activeTab === 'account'      && <AccountTab />}
          {activeTab === 'privacy'      && <PrivacyTab />}
          {activeTab === 'app-settings' && <AppSettingsTab />}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { color: '#f1f5f9', fontSize: 26, fontWeight: '800' },
  headerAccent: { color: '#3b82f6' },
  headerSub: { color: '#64748b', fontSize: 13, marginTop: 4 },

  tabsRow: { paddingHorizontal: 20, paddingVertical: 4, gap: 8, flexDirection: 'row' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b',
  },
  tabActive: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' },
  tabText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#3b82f6' },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  tabContent: { padding: 20, gap: 4 },

  // Avatar
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatarBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#334155', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatar: { width: 56, height: 56 },
  profileName: { color: '#f1f5f9', fontSize: 16, fontWeight: '700' },
  profileVersion: { color: '#64748b', fontWeight: '400' },
  profileSub: { color: '#64748b', fontSize: 12, marginTop: 2 },

  // Fields
  field: { marginBottom: 14 },
  fieldLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#f1f5f9', fontSize: 14 },
  inputDisabled: { opacity: 0.5 },

  // Pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b' },
  pillActive: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' },
  pillText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#3b82f6' },

  // Save button
  saveBtn: { marginTop: 8, backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Toggles
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  toggleLabel: { color: '#cbd5e1', fontSize: 14, fontWeight: '500' },

  // Privacy
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 16 },
  sectionTitle: { color: '#f1f5f9', fontSize: 15, fontWeight: '600', marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 10 },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  outlineBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#dc2626' },
  dangerBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // App info
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { color: '#94a3b8', fontSize: 14 },
  infoValue: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
});
