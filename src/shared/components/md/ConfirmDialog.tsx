import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { md } from '@/shared/theme/material';
import Button from './Button';

type ConfirmDialogProps = {
    visible: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

/**
 * Material dialog used instead of `Alert.alert`.
 *
 * react-native-web does not implement `Alert`, so every Alert-based confirmation
 * silently did nothing on web. This renders the same on every platform.
 */
export default function ConfirmDialog({
    visible,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <Pressable style={s.scrim} onPress={onCancel}>
                <Pressable style={s.dialog} onPress={(e) => e.stopPropagation()}>
                    <Text style={s.title}>{title}</Text>
                    {message ? <Text style={s.message}>{message}</Text> : null}
                    <View style={s.actions}>
                        <Button label={cancelLabel} variant="text" onPress={onCancel} />
                        <Button
                            label={confirmLabel}
                            variant={destructive ? 'filled' : 'filled'}
                            onPress={onConfirm}
                            style={destructive ? s.destructive : undefined}
                        />
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const s = StyleSheet.create({
    scrim: {
        flex: 1,
        backgroundColor: md.color.scrim,
        alignItems: 'center',
        justifyContent: 'center',
        padding: md.space.xl,
    },
    dialog: {
        width: '100%',
        maxWidth: 400,
        borderRadius: md.radius.xl,
        backgroundColor: md.color.surfaceContainerHigh,
        padding: md.space.xl,
        gap: md.space.lg,
    },
    title: { ...md.type.titleLarge, color: md.color.onSurface },
    message: { ...md.type.bodyMedium, color: md.color.onSurfaceVariant },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: md.space.sm,
        marginTop: md.space.sm,
    },
    destructive: { backgroundColor: md.color.error },
});
