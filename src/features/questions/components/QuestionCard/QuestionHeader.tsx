import { BookmarkSimple, Flag, Pause, Timer } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { toast } from 'sonner-native';
import Chip from '@/shared/components/md/Chip';
import IconButton from '@/shared/components/md/IconButton';
import { difficultyChip, md } from '@/shared/theme/material';
import type { Question } from '@/shared/types/storage';
import { emitAppEvent } from '@/shared/utils/appEvents';
import useBookmark from '../../hooks/useBookmark';
import {
    getDifficultyDisplayText,
    getQuestionTypeText,
    isMultipleSelection,
} from '../../utils/questionUtils';
import BookmarkModal from './BookmarkModal';

type TimerProps = {
    minutes: string;
    seconds: string;
    isActive: boolean;
    onToggle: () => void;
};

type QuestionHeaderProps = {
    questionNumber: number;
    totalQuestions: number;
    question: Question;
    subjectSlug: string | undefined;
    timer?: TimerProps | undefined;
    marked?: boolean | undefined;
    isAnswered: boolean;
};

export default function QuestionHeader({
    questionNumber,
    totalQuestions,
    question,
    subjectSlug,
    timer,
    marked,
    isAnswered,
}: QuestionHeaderProps) {
    const { bookmarksMap, fetchBookmarks, toggleBookmark, updateBookmarkNote, loading } =
        useBookmark();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const currentBookmark = bookmarksMap[question.id];
    const isBookmarked = Boolean(currentBookmark);

    useEffect(() => {
        // Without a slug we fetch across subjects, which is what revision sets
        // and test reviews need.
        fetchBookmarks(subjectSlug).catch(() => {
            // A failed bookmark fetch must not block the question itself.
        });
    }, [subjectSlug, question.id, fetchBookmarks]);

    const handleSave = async (noteText: string) => {
        try {
            if (isBookmarked) {
                await updateBookmarkNote({
                    subjectSlug,
                    questionId: question.id,
                    note: noteText.trim(),
                });
                toast.success('Bookmark note updated');
            } else {
                await toggleBookmark({
                    subjectSlug,
                    questionId: question.id,
                    ...(noteText.trim() ? { note: noteText.trim() } : {}),
                });
                toast.success('Question bookmarked');
            }
            emitAppEvent('BOOKMARKS_UPDATED');
            setIsDialogOpen(false);
        } catch (err) {
            console.error('Failed to save bookmark:', err);
            toast.error('Failed to save bookmark. Please try again.');
        }
    };

    const handleRemove = async () => {
        if (!isBookmarked) {
            setIsDialogOpen(false);
            return;
        }
        try {
            await toggleBookmark({ subjectSlug, questionId: question.id });
            emitAppEvent('BOOKMARKS_UPDATED');
            toast.success('Bookmark removed');
            setIsDialogOpen(false);
        } catch (err) {
            console.error('Failed to remove bookmark:', err);
            toast.error('Failed to remove bookmark. Please try again.');
        }
    };

    const examList = Array.isArray(question.metadata?.exam)
        ? (question.metadata.exam as unknown as string[])
        : [question.metadata?.exam || 'GATE'];

    // One compact line. `getQuestionTypeText` already says "Multiple Select
    // Question", so the separate "Multiple selection" flag would be redundant.
    const meta = [
        question.year ? `${examList.join('/').toUpperCase()} ${question.year}` : 'Year unknown',
        question.question_type ? getQuestionTypeText(question) : null,
        question.marks ? `${question.marks} mark${question.marks > 1 ? 's' : ''}` : null,
    ]
        .filter(Boolean)
        .join('  ·  ');

    const difficulty = difficultyChip(question.difficulty);

    return (
        <View style={s.wrap}>
            <View style={s.titleRow}>
                <View style={s.titleText}>
                    <Text style={s.title}>
                        Question {questionNumber}
                        <Text style={s.titleTotal}> of {totalQuestions}</Text>
                    </Text>
                    <Text style={s.meta} numberOfLines={1}>
                        {meta}
                    </Text>
                </View>

                <IconButton
                    onPress={() => setIsDialogOpen(true)}
                    accessibilityLabel={isBookmarked ? 'Edit bookmark' : 'Add bookmark'}
                    variant={isBookmarked ? 'tonal' : 'standard'}
                    icon={(c, size) => (
                        <BookmarkSimple
                            size={size}
                            color={isBookmarked ? md.color.primary : c}
                            weight={isBookmarked ? 'fill' : 'regular'}
                        />
                    )}
                />
            </View>

            <View style={s.chipRow}>
                <Chip label={getDifficultyDisplayText(question.difficulty)} tone={difficulty} />

                {timer && (
                    <Chip
                        label={`${timer.minutes}:${timer.seconds}`}
                        onPress={isAnswered ? undefined : timer.onToggle}
                        selected={timer.isActive}
                        icon={(c, size) =>
                            timer.isActive ? (
                                <Pause size={size} color={c} weight="fill" />
                            ) : (
                                <Timer size={size} color={c} />
                            )
                        }
                    />
                )}

                {isMultipleSelection(question) && <Chip label="Select all that apply" />}

                {marked && (
                    <Chip
                        label="Marked"
                        tone={{ bg: md.color.primaryContainer, fg: md.color.onPrimaryContainer }}
                        icon={(c, size) => <Flag size={size} color={c} weight="fill" />}
                    />
                )}
            </View>

            <BookmarkModal
                visible={isDialogOpen}
                isBookmarked={isBookmarked}
                initialNote={currentBookmark?.notes ?? ''}
                loading={loading}
                onClose={() => setIsDialogOpen(false)}
                onSave={handleSave}
                onRemove={handleRemove}
            />
        </View>
    );
}

const s = StyleSheet.create({
    wrap: {
        paddingBottom: md.space.lg,
        borderBottomWidth: 1,
        borderBottomColor: md.color.outlineVariant,
        gap: md.space.md,
    },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: md.space.sm },
    titleText: { flex: 1, gap: md.space.xs },
    title: { ...md.type.headlineSmall, color: md.color.onSurface },
    titleTotal: { ...md.type.titleMedium, color: md.color.onSurfaceVariant },
    meta: { ...md.type.bodySmall, color: md.color.onSurfaceVariant },
    chipRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: md.space.sm },
});

