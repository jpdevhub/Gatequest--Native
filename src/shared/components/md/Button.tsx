import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { md } from '@/shared/theme/material';

type Variant = 'filled' | 'tonal' | 'outlined' | 'text';

type ButtonProps = {
    label: string;
    onPress: () => void;
    variant?: Variant;
    icon?: (color: string, size: number) => React.ReactNode;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
};

const SURFACE: Record<Variant, { bg: string; fg: string; border?: string }> = {
    filled: { bg: md.color.primary, fg: md.color.onPrimary },
    tonal: { bg: md.color.secondaryContainer, fg: md.color.onSecondaryContainer },
    outlined: { bg: 'transparent', fg: md.color.primary, border: md.color.outline },
    text: { bg: 'transparent', fg: md.color.primary },
};

/** Material 3 common button. Height stays on the 40dp spec with a 48dp target. */
export default function Button({
    label,
    onPress,
    variant = 'filled',
    icon,
    disabled,
    loading,
    fullWidth,
    style,
}: ButtonProps) {
    const tone = SURFACE[variant];
    const fg = disabled ? md.color.onSurfaceDisabled : tone.fg;

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
            style={({ pressed }) => [
                s.base,
                { backgroundColor: disabled ? md.color.surfaceContainerHigh : tone.bg },
                tone.border ? { borderWidth: 1, borderColor: tone.border } : null,
                fullWidth && s.fullWidth,
                pressed && !disabled && s.pressed,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={fg} />
            ) : (
                <>
                    {icon?.(fg, 18)}
                    <Text style={[s.label, { color: fg }]} numberOfLines={1}>
                        {label}
                    </Text>
                </>
            )}
        </Pressable>
    );
}

const s = StyleSheet.create({
    base: {
        minHeight: 40,
        paddingHorizontal: md.space.xl,
        paddingVertical: md.space.sm,
        borderRadius: md.radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: md.space.sm,
        overflow: 'hidden',
    },
    fullWidth: { alignSelf: 'stretch' },
    pressed: { opacity: 0.88 },
    label: { ...md.type.labelLarge },
});
