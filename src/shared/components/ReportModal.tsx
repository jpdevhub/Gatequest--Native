import { useState } from 'react';
import { WhatsappLogo } from 'phosphor-react-native';
import { isSupportConfigured, openSupportChat } from '@/features/support/support';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const REPORT_TYPES = [
    { id: 'wrong_answer', label: 'Wrong answer key' },
    { id: 'typo', label: 'Typo / formatting' },
    { id: 'image_missing', label: 'Missing or broken image' },
    { id: 'wrong_explanation', label: 'Incorrect explanation' },
    { id: 'other', label: 'Something else' },
];

type ReportModalProps = {
    show: boolean;
    onClose: () => void;
    onSubmit: (reportType: string, reportText: string) => void | Promise<void>;
    reportSubmitting: boolean;
    questionId?: string;
};

export default function ReportModal({ show, onClose, onSubmit, reportSubmitting, questionId }: ReportModalProps) {
    const [reportType, setReportType] = useState(REPORT_TYPES[0]!.id);
    const [reportText, setReportText] = useState('');

    return (
        <Modal visible={show} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={s.backdrop} onPress={onClose}>
                <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
                    <Text style={s.title}>Report this question</Text>
                    <Text style={s.sub}>Tell us what looks wrong so we can fix it.</Text>

                    <View style={s.chips}>
                        {REPORT_TYPES.map((type) => {
                            const active = reportType === type.id;
                            return (
                                <Pressable
                                    key={type.id}
                                    style={[s.chip, active && s.chipActive]}
                                    onPress={() => setReportType(type.id)}
                                >
                                    <Text style={[s.chipText, active && s.chipTextActive]}>
                                        {type.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <TextInput
                        value={reportText}
                        onChangeText={setReportText}
                        multiline
                        placeholder="Add details (optional)"
                        placeholderTextColor="#475569"
                        style={s.input}
                    />

                    {isSupportConfigured() && (
                        <Pressable
                            style={s.chatRow}
                            onPress={() => {
                                onClose();
                                void openSupportChat({
                                    topic: 'Question report',
                                    ...(questionId ? { questionId } : {}),
                                });
                            }}
                        >
                            <WhatsappLogo size={16} color="#25D366" weight="fill" />
                            <Text style={s.chatText}>
                                Easier to show than tell? Chat with a screenshot instead
                            </Text>
                        </Pressable>
                    )}

                    <View style={s.footer}>
                        <Pressable style={[s.btn, s.cancel]} onPress={onClose} disabled={reportSubmitting}>
                            <Text style={s.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[s.btn, s.submit, reportSubmitting && s.disabled]}
                            onPress={() => onSubmit(reportType, reportText)}
                            disabled={reportSubmitting}
                        >
                            {reportSubmitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={s.submitText}>Send report</Text>
                            )}
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.7)', justifyContent: 'center', padding: 20 },
    sheet: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 20, gap: 12 },
    title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
    sub: { color: '#64748b', fontSize: 13 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b' },
    chipActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)' },
    chipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
    chipTextActive: { color: '#60a5fa' },
    input: {
        minHeight: 90, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b',
        backgroundColor: '#0b1220', color: '#e2e8f0', padding: 12, fontSize: 14, textAlignVertical: 'top',
    },
    chatRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
        backgroundColor: 'rgba(37,211,102,0.08)',
    },
    chatText: { flex: 1, color: '#86efac', fontSize: 12, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
    btn: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, minWidth: 96, alignItems: 'center' },
    cancel: { backgroundColor: '#1e293b' },
    cancelText: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
    submit: { backgroundColor: '#dc2626' },
    submitText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    disabled: { opacity: 0.6 },
});
