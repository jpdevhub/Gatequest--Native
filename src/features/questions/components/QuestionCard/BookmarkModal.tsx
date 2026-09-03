import { Check, Trash } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type BookmarkModalProps = {
    visible: boolean;
    isBookmarked: boolean;
    initialNote: string;
    loading: boolean;
    onClose: () => void;
    onSave: (note: string) => void;
    onRemove: () => void;
};

export default function BookmarkModal({
    visible,
    isBookmarked,
    initialNote,
    loading,
    onClose,
    onSave,
    onRemove,
}: BookmarkModalProps) {
    const [noteText, setNoteText] = useState(initialNote);

    useEffect(() => {
        if (visible) setNoteText(initialNote);
    }, [visible, initialNote]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={s.backdrop} onPress={onClose}>
                <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
                    <Text style={s.title}>{isBookmarked ? 'Edit bookmark note' : 'Add bookmark'}</Text>
                    <Text style={s.label}>Notes (optional — max 100 characters)</Text>
                    <TextInput
                        value={noteText}
                        onChangeText={(t) => setNoteText(t.slice(0, 100))}
                        multiline
                        maxLength={100}
                        placeholder="Key formula, error insight, or a reminder…"
                        placeholderTextColor="#475569"
                        style={s.input}
                    />
                    <Text style={s.counter}>{noteText.length}/100</Text>

                    <View style={s.footer}>
                        {isBookmarked ? (
                            <Pressable style={[s.btn, s.remove]} onPress={onRemove} disabled={loading}>
                                <Trash size={14} color="#fecaca" />
                                <Text style={s.removeText}>Remove</Text>
                            </Pressable>
                        ) : (
                            <View />
                        )}

                        <View style={s.rightGroup}>
                            <Pressable style={[s.btn, s.cancel]} onPress={onClose} disabled={loading}>
                                <Text style={s.cancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[s.btn, s.save, loading && s.disabled]}
                                onPress={() => onSave(noteText)}
                                disabled={loading}
                            >
                                <Check size={14} color="#fff" weight="bold" />
                                <Text style={s.saveText}>Save</Text>
                            </Pressable>
                        </View>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.7)', justifyContent: 'center', padding: 20 },
    sheet: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 20, gap: 10 },
    title: { color: '#f1f5f9', fontSize: 17, fontWeight: '700' },
    label: { color: '#64748b', fontSize: 12 },
    input: {
        minHeight: 80, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b',
        backgroundColor: '#0b1220', color: '#e2e8f0', padding: 12, fontSize: 14, textAlignVertical: 'top',
    },
    counter: { color: '#475569', fontSize: 11, textAlign: 'right' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    rightGroup: { flexDirection: 'row', gap: 8 },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
    remove: { backgroundColor: 'rgba(220,38,38,0.16)' },
    removeText: { color: '#fecaca', fontSize: 13, fontWeight: '600' },
    cancel: { backgroundColor: '#1e293b' },
    cancelText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
    save: { backgroundColor: '#2563eb' },
    saveText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    disabled: { opacity: 0.6 },
});
