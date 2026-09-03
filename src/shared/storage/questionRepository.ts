/**
 * questionRepository — port of the PWA's `src/storage/questionRepository.ts`.
 *
 * Questions are bucketed per subject so a subject screen only reads what it needs.
 * Questions that arrive without a subject (from a revision/test join) land in a
 * shared "loose" bucket that backs id lookups.
 */
import type { Question, QuestionSyncMetadata } from '@/shared/types/storage';
import { readDoc, updateDoc } from './appStorage';

const META_DOC = 'questions_meta';
const LOOSE_DOC = 'questions_loose';

const subjectDoc = (subjectId: string) => `questions_${subjectId}`;

type LooseMap = Record<string, Question>;
type MetaMap = Record<string, QuestionSyncMetadata>;

export function getQuestionsBySubject(subjectId: string): Question[] {
    return readDoc<Question[]>(subjectDoc(subjectId), []);
}

export function getQuestionByIds(ids: string[]): Question[] {
    const loose = readDoc<LooseMap>(LOOSE_DOC, {});
    return ids.map((id) => loose[id]).filter((q): q is Question => !!q);
}

export function getQuestionById(id: string): Question | undefined {
    return readDoc<LooseMap>(LOOSE_DOC, {})[id];
}

export function getSubjectSyncMetadata(subjectId: string): QuestionSyncMetadata | undefined {
    return readDoc<MetaMap>(META_DOC, {})[subjectId];
}

export function bulkUpsertQuestions(questions: Question[]): void {
    if (questions.length === 0) return;

    // Every question is addressable by id.
    updateDoc<LooseMap>(LOOSE_DOC, {}, (current) => {
        const next = { ...current };
        for (const q of questions) next[q.id] = q;
        return next;
    });

    // Questions that belong to a subject also join that subject's bucket.
    const bySubject = new Map<string, Question[]>();
    for (const q of questions) {
        if (!q.subject_id) continue;
        const bucket = bySubject.get(q.subject_id) ?? [];
        bucket.push(q);
        bySubject.set(q.subject_id, bucket);
    }

    for (const [subjectId, incoming] of bySubject) {
        updateDoc<Question[]>(subjectDoc(subjectId), [], (current) => {
            const merged = new Map(current.map((q) => [q.id, q]));
            for (const q of incoming) merged.set(q.id, q);
            return [...merged.values()];
        });
    }
}

export function updateSubjectSyncMetadata(subjectId: string, lastFetchedAt?: string): void {
    updateDoc<MetaMap>(META_DOC, {}, (current) => ({
        ...current,
        [subjectId]: {
            subject_id: subjectId,
            last_sync: Date.now().toString(),
            ...(lastFetchedAt
                ? { last_fetched_at: lastFetchedAt }
                : current[subjectId]?.last_fetched_at
                  ? { last_fetched_at: current[subjectId].last_fetched_at }
                  : {}),
        },
    }));
}
