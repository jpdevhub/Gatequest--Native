/**
 * questionStore — singleton that loads mega.json once and exposes fast lookups.
 * All consumers call `getStore()` which returns the already-loaded store.
 * No async needed — JSON is bundled in the APK.
 */
import type { Question, NormQuestion } from '@/shared/types/Question';
import { normalise } from '@/shared/types/Question';

// Bundled with the APK — no network needed
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RAW: Question[] = require('../../../docs/mega.json');

export interface SubjectMeta {
  subject: string;
  count: number;
  topics: TopicMeta[];
}

export interface TopicMeta {
  topic: string;
  count: number;
}

interface Store {
  all: NormQuestion[];
  byId: Map<string, NormQuestion>;
  bySubject: Map<string, NormQuestion[]>;
  subjects: SubjectMeta[];
}

let _store: Store | null = null;

function build(): Store {
  const all = RAW.map(normalise);
  const byId = new Map<string, NormQuestion>();
  const bySubjectMap = new Map<string, NormQuestion[]>();

  for (const q of all) {
    byId.set(q.id, q);
    const bucket = bySubjectMap.get(q.subject) ?? [];
    bucket.push(q);
    bySubjectMap.set(q.subject, bucket);
  }

  // Build subject meta with topic breakdown
  const subjects: SubjectMeta[] = [];
  for (const [subject, questions] of bySubjectMap) {
    const topicMap = new Map<string, number>();
    for (const q of questions) {
      topicMap.set(q.topic, (topicMap.get(q.topic) ?? 0) + 1);
    }
    const topics: TopicMeta[] = [...topicMap.entries()]
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
    subjects.push({ subject, count: questions.length, topics });
  }
  subjects.sort((a, b) => b.count - a.count);

  return { all, byId, bySubject: bySubjectMap, subjects };
}

export function getStore(): Store {
  if (!_store) _store = build();
  return _store;
}

// ── Public API ──────────────────────────────────────────────────────────────

export function getSubjects(): SubjectMeta[] {
  return getStore().subjects;
}

export function getTopicsForSubject(subject: string): TopicMeta[] {
  const meta = getStore().subjects.find((s) => s.subject === subject);
  return meta?.topics ?? [];
}

export function getQuestionsBySubject(subject: string): NormQuestion[] {
  return getStore().bySubject.get(subject) ?? [];
}

export function getQuestionsByTopic(subject: string, topic: string): NormQuestion[] {
  return getQuestionsBySubject(subject).filter((q) => q.topic === topic);
}

export function getQuestionById(id: string): NormQuestion | undefined {
  return getStore().byId.get(id);
}

export function getQuestionsByIds(ids: string[]): NormQuestion[] {
  const { byId } = getStore();
  return ids.flatMap((id) => {
    const q = byId.get(id);
    return q ? [q] : [];
  });
}
