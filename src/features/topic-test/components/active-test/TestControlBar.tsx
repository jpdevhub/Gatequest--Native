import { ArrowLeft, ArrowRight, Eraser, Flag, GridFour } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/shared/components/md/Button';
import { md } from '@/shared/theme/material';

type TestControlBarProps = {
    isFirst: boolean;
    isLast: boolean;
    isReviewMarked: boolean;
    onNext: () => void;
    onPrev: () => void;
    onMarkForReview: () => void;
    onClearResponse: () => void;
    onTogglePalette: () => void;
};

export default function TestControlBar({
    isFirst,
    isLast,
    isReviewMarked,
    onNext,
    onPrev,
    onMarkForReview,
    onClearResponse,
    onTogglePalette,
}: TestControlBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, md.space.md) }]}>
            <View style={s.row}>
                <Button
                    label={isReviewMarked ? 'Marked' : 'Review'}
                    variant={isReviewMarked ? 'filled' : 'text'}
                    onPress={onMarkForReview}
                    style={s.grow}
                    icon={(c, size) => (
                        <Flag size={size} color={c} weight={isReviewMarked ? 'fill' : 'regular'} />
                    )}
                />
                <Button
                    label="Clear"
                    variant="text"
                    onPress={onClearResponse}
                    style={s.grow}
                    icon={(c, size) => <Eraser size={size} color={c} />}
                />
                <Button
                    label="Palette"
                    variant="text"
                    onPress={onTogglePalette}
                    style={s.grow}
                    icon={(c, size) => <GridFour size={size} color={c} />}
                />
            </View>

            <View style={s.row}>
                <Button
                    label="Previous"
                    variant="outlined"
                    onPress={onPrev}
                    disabled={isFirst}
                    style={s.grow}
                    icon={(c, size) => <ArrowLeft size={size} color={c} weight="bold" />}
                />
                <Button
                    label="Next"
                    onPress={onNext}
                    disabled={isLast}
                    style={s.grow}
                    icon={(c, size) => <ArrowRight size={size} color={c} weight="bold" />}
                />
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    bar: {
        gap: md.space.sm,
        paddingHorizontal: md.space.md,
        paddingTop: md.space.md,
        backgroundColor: md.color.surfaceContainer,
        borderTopWidth: 1,
        borderTopColor: md.color.outlineVariant,
    },
    row: { flexDirection: 'row', gap: md.space.sm },
    grow: { flex: 1, paddingHorizontal: md.space.sm },
});
