// Question types matching the mega.json schema exactly
export type QuestionType = 'multiple-choice' | 'numerical' | 'multiple-select';

export type NATAnswer =
  | { type: 'exact'; value: number }
  | { type: 'multiple'; values: number[] }
  | { type: 'range'; min: number; max: number; inclusive?: boolean; includsive?: boolean };

export type CorrectAnswer = number[] | NATAnswer;

export interface Question {
  id: string;
  year: number;
  questionNumber?: number;
  question_number?: number; // 2026 batch uses snake_case
  subject: string;
  topic: string;
  questionType?: QuestionType;
  question_type?: QuestionType; // 2026 batch uses snake_case
  question: string;
  options: string[];
  correctAnswer: CorrectAnswer;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  sourceURL?: string;
  verified?: boolean;
  metadata: {
    set: string;
    exam: string[];
    language?: string;
    paperType?: string;
  };
}

// Normalised view — always use this, not raw Question
export interface NormQuestion {
  id: string;
  year: number;
  questionNumber: number;
  subject: string;
  topic: string;
  questionType: QuestionType;
  question: string;
  options: string[];
  correctAnswer: CorrectAnswer;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  sourceURL: string;
  exams: string[];
}

export function normalise(q: Question): NormQuestion {
  return {
    id: q.id,
    year: q.year,
    questionNumber: (q.questionNumber ?? q.question_number) ?? 0,
    subject: q.subject,
    topic: q.topic,
    questionType: (q.questionType ?? q.question_type ?? 'multiple-choice') as QuestionType,
    question: q.question,
    options: q.options ?? [],
    correctAnswer: q.correctAnswer,
    difficulty: q.difficulty ?? 'Medium',
    marks: q.marks ?? 1,
    sourceURL: q.sourceURL ?? '',
    exams: q.metadata?.exam ?? [],
  };
}
