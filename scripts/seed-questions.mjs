/**
 * Seeds public.questions from docs/mega.json.
 *
 * Idempotent: upserts on primary key, so re-running never duplicates rows.
 * A per-row trigger keeps subjects.question_count in step automatically.
 *
 * Usage:
 *   EXPO_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-questions.mjs
 *   ... node scripts/seed-questions.mjs --apply
 *
 * Without --apply it validates and reports only. The service-role key is
 * required because RLS blocks anonymous writes to public.questions.
 */
import { readFileSync } from 'node:fs';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes('--apply');

// mega.json predates the subjects table; these two names were renamed since.
const SUBJECT_ALIASES = {
  'General Aptitude': 'Aptitude',
  'Programming and Data Structures': 'Data Structures',
};

const headers = {
  apikey: SERVICE_KEY,
  Authorization: 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json',
};

function toRow(q, subjectByName) {
  const rawSubject = q.subject;
  const subjectName = SUBJECT_ALIASES[rawSubject] ?? rawSubject;
  const subject = subjectByName.get(subjectName);
  if (!subject) return { error: `no subject row for "${subjectName}"` };

  const questionType = q.questionType ?? q.question_type;
  const correctAnswer = q.correctAnswer ?? q.correct_answer;

  if (!q.id || !q.question || !questionType || correctAnswer === undefined || !q.year) {
    return { error: 'missing required field' };
  }

  return {
    row: {
      id: q.id,
      year: q.year,
      question_number: q.questionNumber ?? q.question_number ?? null,
      subject: subjectName,
      subject_id: subject.id,
      topic: q.topic ?? null,
      question_type: questionType,
      question: q.question,
      options: Array.isArray(q.options) && q.options.length ? q.options : null,
      correct_answer: correctAnswer,
      difficulty: q.difficulty ?? 'Medium',
      marks: q.marks ?? 1,
      source_url: q.sourceURL ?? q.source_url ?? null,
      answer_text: q.answer_text ?? null,
      added_by: q.added_by ?? null,
      // useQuestions filters on verified=true, so anything unverified would be invisible.
      verified: q.verified ?? true,
      metadata: q.metadata ?? {},
    },
  };
}

(async () => {
  const res = await fetch(SUPABASE_URL + '/rest/v1/subjects?select=id,name', { headers });
  const subjects = await res.json();
  const subjectByName = new Map(subjects.map((s) => [s.name, s]));

  const mega = JSON.parse(readFileSync(new URL('../docs/mega.json', import.meta.url), 'utf8'));

  const rows = [];
  const problems = new Map();
  const seen = new Set();
  let dupes = 0;

  for (const q of mega) {
    const { row, error } = toRow(q, subjectByName);
    if (error) {
      problems.set(error, (problems.get(error) ?? 0) + 1);
      continue;
    }
    if (seen.has(row.id)) { dupes++; continue; }
    seen.add(row.id);
    rows.push(row);
  }

  console.log('mega.json rows      :', mega.length);
  console.log('duplicate ids       :', dupes);
  console.log('rejected            :', [...problems.entries()]);
  console.log('ready to upsert     :', rows.length);
  console.log('unverified (hidden) :', rows.filter((r) => !r.verified).length);
  console.log('per subject         :', Object.entries(
    rows.reduce((a, r) => ((a[r.subject] = (a[r.subject] ?? 0) + 1), a), {})
  ).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(', '));

  if (!APPLY) { console.log('\nDRY RUN — nothing written. Re-run with --apply.'); return; }

  const BATCH = 250;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const r = await fetch(SUPABASE_URL + '/rest/v1/questions', {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(slice),
    });
    if (!r.ok) {
      console.error('FAILED at offset', i, r.status, (await r.text()).slice(0, 500));
      process.exit(1);
    }
    done += slice.length;
    process.stdout.write(`\rupserted ${done}/${rows.length}`);
  }
  console.log('\ndone');
})();
