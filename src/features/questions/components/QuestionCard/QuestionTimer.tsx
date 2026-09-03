import { Pause, Timer } from 'phosphor-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type QuestionTimerProps = {
    minutes: string;
    seconds: string;
    isActive: boolean;
    onToggle: () => void;
    isAnswered: boolean;
};

export default function QuestionTimer({
    minutes,
    seconds,
    isActive,
    onToggle,
    isAnswered,
}: QuestionTimerProps) {
    const shouldShowTime = isActive || minutes !== '00' || seconds !== '00';

    return (
        <Pressable
            style={({ pressed }) => [s.btn, pressed && !isAnswered && s.pressed]}
            onPress={isAnswered ? undefined : onToggle}
            disabled={isAnswered}
        >
            <Animated.View key={isActive ? 'pause' : 'timer'} entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
                {isActive ? (
                    <Pause size={15} color="#fff" weight="fill" />
                ) : (
                    <Timer size={15} color="#fff" weight="bold" />
                )}
            </Animated.View>
            {shouldShowTime && (
                <View>
                    <Text style={[s.label, !isActive && s.labelIdle]}>
                        {minutes}:{seconds}
                    </Text>
                </View>
            )}
        </Pressable>
    );
}

const s = StyleSheet.create({
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#3b82f6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    pressed: { backgroundColor: '#2563eb', transform: [{ scale: 0.96 }] },
    label: { color: '#fff', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
    labelIdle: { opacity: 0.75 },
});
