import { Pressable, StyleSheet, Text, View } from 'react-native';
import { md } from '@/shared/theme/material';

type ChipProps = {
    label: string;
    selected?: boolean;
    onPress?: () => void;
    icon?: (color: string, size: number) => React.ReactNode;
    /** Static chips (no press target) render as a plain container. */
    tone?: { bg: string; fg: string };
};

/** Material 3 assist / filter chip. */
export default function Chip({ label, selected, onPress, icon, tone }: ChipProps) {
    const bg = tone?.bg ?? (selected ? md.color.secondaryContainer : 'transparent');
    const fg = tone?.fg ?? (selected ? md.color.onSecondaryContainer : md.color.onSurfaceVariant);
    const showBorder = !tone && !selected;

    const content = (
        <>
            {icon?.(fg, 16)}
            <Text style={[s.label, { color: fg }]} numberOfLines={1}>
                {label}
            </Text>
        </>
    );

    if (!onPress) {
        return (
            <View style={[s.base, { backgroundColor: bg }, showBorder && s.outlined]}>{content}</View>
        );
    }

    return (
        <Pressable
            onPress={onPress}
            android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
            style={({ pressed }) => [
                s.base,
                { backgroundColor: bg },
                showBorder && s.outlined,
                pressed && s.pressed,
            ]}
        >
            {content}
        </Pressable>
    );
}

const s = StyleSheet.create({
    base: {
        minHeight: 32,
        paddingHorizontal: md.space.md,
        paddingVertical: md.space.xs + 2,
        borderRadius: md.radius.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.sm - 2,
        overflow: 'hidden',
    },
    outlined: { borderWidth: 1, borderColor: md.color.outlineVariant },
    pressed: { opacity: 0.8 },
    label: { ...md.type.labelMedium },
});
