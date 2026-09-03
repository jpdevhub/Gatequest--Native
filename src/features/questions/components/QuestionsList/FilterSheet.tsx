import { X } from 'phosphor-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Group = {
    key: string;
    label: string;
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
};

type FilterSheetProps = {
    visible: boolean;
    onClose: () => void;
    onReset: () => void;
    groups: Group[];
    resultCount: number;
};

export default function FilterSheet({
    visible,
    onClose,
    onReset,
    groups,
    resultCount,
}: FilterSheetProps) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={s.backdrop} onPress={onClose}>
                <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
                    <View style={s.grabber} />
                    <View style={s.header}>
                        <Text style={s.title}>Filters</Text>
                        <Pressable onPress={onClose} hitSlop={12}>
                            <X size={18} color="#94a3b8" weight="bold" />
                        </Pressable>
                    </View>

                    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
                        {groups.map((group) =>
                            group.options.length === 0 ? null : (
                                <View key={group.key} style={s.group}>
                                    <Text style={s.groupLabel}>{group.label}</Text>
                                    <View style={s.chips}>
                                        {group.options.map((option) => {
                                            const active = group.selected.includes(option);
                                            return (
                                                <Pressable
                                                    key={option}
                                                    onPress={() => group.onToggle(option)}
                                                    style={[s.chip, active && s.chipActive]}
                                                >
                                                    <Text
                                                        style={[s.chipText, active && s.chipTextActive]}
                                                        numberOfLines={1}
                                                    >
                                                        {option}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>
                            )
                        )}
                    </ScrollView>

                    <View style={s.footer}>
                        <Pressable style={[s.btn, s.reset]} onPress={onReset}>
                            <Text style={s.resetText}>Reset</Text>
                        </Pressable>
                        <Pressable style={[s.btn, s.apply]} onPress={onClose}>
                            <Text style={s.applyText}>
                                Show {resultCount} question{resultCount === 1 ? '' : 's'}
                            </Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.65)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#0f172a',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        borderTopWidth: 1,
        borderColor: '#1e293b',
        paddingHorizontal: 20,
        paddingBottom: 20,
        maxHeight: '82%',
    },
    grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#334155', marginTop: 10 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
    title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
    scroll: { flexGrow: 0 },
    group: { marginBottom: 18, gap: 10 },
    groupLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b', maxWidth: '100%',
    },
    chipActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)' },
    chipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
    chipTextActive: { color: '#60a5fa' },
    footer: { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
    btn: { paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    reset: { backgroundColor: '#1e293b', paddingHorizontal: 22 },
    resetText: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
    apply: { flex: 1, backgroundColor: '#2563eb' },
    applyText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
