import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { md } from '@/shared/theme/material';

type IconButtonProps = {
    onPress: () => void;
    icon: (color: string, size: number) => React.ReactNode;
    variant?: 'standard' | 'tonal' | 'filled';
    disabled?: boolean;
    accessibilityLabel: string;
    style?: StyleProp<ViewStyle>;
};

const SURFACE = {
    standard: { bg: 'transparent', fg: md.color.onSurfaceVariant },
    tonal: { bg: md.color.secondaryContainer, fg: md.color.onSecondaryContainer },
    filled: { bg: md.color.primary, fg: md.color.onPrimary },
};

/** Material 3 icon button: 40dp visual, 48dp touch target. */
export default function IconButton({
    onPress,
    icon,
    variant = 'standard',
    disabled,
    accessibilityLabel,
    style,
}: IconButtonProps) {
    const tone = SURFACE[variant];
    const fg = disabled ? md.color.onSurfaceDisabled : tone.fg;

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            hitSlop={4}
            android_ripple={{ color: 'rgba(255,255,255,0.12)', borderless: true, radius: 22 }}
            style={({ pressed }) => [
                s.base,
                { backgroundColor: disabled && variant !== 'standard' ? md.color.surfaceContainerHigh : tone.bg },
                pressed && s.pressed,
                style,
            ]}
        >
            {icon(fg, 20)}
        </Pressable>
    );
}

const s = StyleSheet.create({
    base: {
        width: 40,
        height: 40,
        borderRadius: md.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: { opacity: 0.7 },
});
