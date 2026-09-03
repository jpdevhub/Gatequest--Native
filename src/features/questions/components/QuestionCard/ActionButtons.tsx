import { ArrowLeft, ArrowRight, BookOpen, Eye, Flag } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/shared/components/md/Button';
import IconButton from '@/shared/components/md/IconButton';
import { md } from '@/shared/theme/material';

type ActionButtonsProps = {
    isFirstQuestion: boolean;
    isLastQuestion: boolean;
    handleNext: () => void;
    handlePrevious: () => void;
    showAnswer: boolean;
    handleShowAnswer?: (() => void) | undefined;
    handleSubmit?: (() => void) | undefined;
    handleExplanationClick: () => void;
    isCompatible: boolean | undefined;
    hasSelection: boolean;
};

/**
 * Material bottom app bar: navigation icons flank the primary actions, so the
 * dominant action stays visually obvious at a glance.
 */
export default function ActionButtons({
    isFirstQuestion,
    isLastQuestion,
    handleNext,
    handlePrevious,
    showAnswer,
    handleShowAnswer,
    handleSubmit,
    handleExplanationClick,
    isCompatible,
    hasSelection,
}: ActionButtonsProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, md.space.md) }]}>
            <IconButton
                onPress={handlePrevious}
                disabled={isFirstQuestion}
                accessibilityLabel="Previous question"
                variant="tonal"
                icon={(c, size) => <ArrowLeft size={size} color={c} weight="bold" />}
            />

            {!showAnswer && handleSubmit && handleShowAnswer ? (
                <>
                    <Button
                        label="Submit"
                        onPress={handleSubmit}
                        disabled={!isCompatible || !hasSelection}
                        style={s.grow}
                        icon={(c, size) => <Eye size={size} color={c} weight="bold" />}
                    />
                    <Button
                        label="Answer"
                        variant="tonal"
                        onPress={handleShowAnswer}
                        disabled={!isCompatible}
                        style={s.grow}
                        icon={(c, size) => <Flag size={size} color={c} weight="bold" />}
                    />
                </>
            ) : (
                <Button
                    label="Explanation"
                    variant="tonal"
                    onPress={handleExplanationClick}
                    style={s.grow}
                    icon={(c, size) => <BookOpen size={size} color={c} weight="bold" />}
                />
            )}

            <IconButton
                onPress={handleNext}
                disabled={isLastQuestion}
                accessibilityLabel="Next question"
                variant="tonal"
                icon={(c, size) => <ArrowRight size={size} color={c} weight="bold" />}
            />
        </View>
    );
}

const s = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: md.space.sm,
        paddingHorizontal: md.space.md,
        paddingTop: md.space.md,
        backgroundColor: md.color.surfaceContainer,
        borderTopWidth: 1,
        borderTopColor: md.color.outlineVariant,
    },
    grow: { flex: 1, paddingHorizontal: md.space.md },
});
