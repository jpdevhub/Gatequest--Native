import { Timer } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/shared/components/md/Button';
import Chip from '@/shared/components/md/Chip';
import { md } from '@/shared/theme/material';

type TestHeaderProps = {
    timeDisplay: string;
    questionStatus: string;
    lowTime: boolean;
    onEndTest: () => void;
};

export default function TestHeader({
    timeDisplay,
    questionStatus,
    lowTime,
    onEndTest,
}: TestHeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[s.bar, { paddingTop: insets.top + md.space.sm }]}>
            <Text style={s.title} numberOfLines={1}>
                {questionStatus}
            </Text>

            <Chip
                label={timeDisplay}
                icon={(c, size) => <Timer size={size} color={c} weight="bold" />}
                tone={
                    lowTime
                        ? { bg: md.color.errorContainer, fg: md.color.onErrorContainer }
                        : { bg: md.color.secondaryContainer, fg: md.color.onSecondaryContainer }
                }
            />

            <Button label="End" variant="text" onPress={onEndTest} style={s.endBtn} />
        </View>
    );
}

const s = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.sm,
        paddingHorizontal: md.space.lg,
        paddingBottom: md.space.md,
        backgroundColor: md.color.surfaceContainer,
        borderBottomWidth: 1,
        borderBottomColor: md.color.outlineVariant,
    },
    title: { ...md.type.titleMedium, color: md.color.onSurface, flex: 1 },
    endBtn: { paddingHorizontal: md.space.md },
});
