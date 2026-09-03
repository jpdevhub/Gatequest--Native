import { BookmarkSimple } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

type QuestionBookmarkProps = {
    onPress: () => void;
    isBookmarked?: boolean;
    hasNote?: boolean;
};

export default function QuestionBookmark({
    onPress,
    isBookmarked = false,
    hasNote = false,
}: QuestionBookmarkProps) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                s.btn,
                isBookmarked ? s.marked : s.unmarked,
                pressed && s.pressed,
            ]}
        >
            <BookmarkSimple size={15} color="#fff" weight={isBookmarked ? 'fill' : 'regular'} />
            <Text style={s.label}>
                {isBookmarked ? (hasNote ? 'Note added' : 'Bookmarked') : 'Bookmark'}
            </Text>
        </Pressable>
    );
}

const s = StyleSheet.create({
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    marked: { backgroundColor: '#f59e0b' },
    unmarked: { backgroundColor: '#3b82f6' },
    pressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
    label: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
