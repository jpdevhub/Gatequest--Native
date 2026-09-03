// Bookmarks live in the `question_bookmarks` table and are reached through the
// same three RPCs the PWA uses.
import { useCallback, useState } from 'react';
import { supabase } from '@/shared/utils/supabaseClient';

type Bookmark = { notes: string | null; created_at: string };
export type BookmarksMap = Record<string, Bookmark>;

interface BookmarkProps {
    /** Omit to read and refresh bookmarks across every subject. */
    subjectSlug?: string | undefined;
    questionId: string;
    note?: string;
}

const validateNote = (note?: string) => {
    if (note && note.length > 100) throw new Error('Note cannot exceed 100 characters');
};

export default function useBookmark() {
    const [loading, setLoading] = useState(false);
    const [bookmarksMap, setBookmarksMap] = useState<BookmarksMap>({});

    const fetchBookmarks = useCallback(async (subjectSlug?: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc(
                'get_user_bookmarks',
                subjectSlug ? { p_subject_slug: subjectSlug } : {}
            );

            if (error) throw error;

            const map =
                data?.reduce<BookmarksMap>((acc, bookmark) => {
                    acc[bookmark.question_id] = {
                        notes: bookmark.notes,
                        created_at: bookmark.created_at,
                    };
                    return acc;
                }, {}) ?? {};

            setBookmarksMap(map);
            return data ?? [];
        } catch (err) {
            console.error('Unable to fetch bookmarks: ', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleBookmark = async ({ subjectSlug, questionId, note }: BookmarkProps) => {
        validateNote(note);
        try {
            setLoading(true);
            const { data: added, error } = await supabase.rpc('toggle_question_bookmark', {
                p_question_id: questionId,
                ...(note ? { p_note: note } : {}),
            });
            if (error) throw error;
            await fetchBookmarks(subjectSlug);
            return added;
        } catch (err) {
            console.error('Unable to add/delete bookmark: ', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateBookmarkNote = async ({ subjectSlug, questionId, note }: BookmarkProps) => {
        validateNote(note);
        try {
            setLoading(true);
            const { error } = await supabase.rpc('update_question_bookmark_note', {
                p_question_id: questionId,
                p_note: note ?? '',
            });
            if (error) throw error;
            await fetchBookmarks(subjectSlug);
        } catch (err) {
            console.error('Unable to update bookmark note: ', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { loading, bookmarksMap, fetchBookmarks, toggleBookmark, updateBookmarkNote };
}
