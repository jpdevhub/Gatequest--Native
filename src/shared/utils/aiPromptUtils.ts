/**
 * aiPromptUtils — native port of the PWA's "Ask AI" deep-link flow.
 *
 * The PWA stitches question diagrams onto a canvas and writes them to the clipboard.
 * React Native has no canvas, so images are referenced by URL inside the prompt and the
 * user is handed a ready-to-paste prompt when the deep link would be too long.
 */
import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';
import { toast } from 'sonner-native';
import { isNumericalQuestion } from '@/features/questions/utils/questionUtils';
import { DEFAULT_TEMPLATE } from '@/shared/data/ai_prompt_template';
import type { AIProvider } from '@/shared/types/Settings';
import type { MCQQuestion, MSQQuestion, Question } from '@/shared/types/storage';

export const AI_PROVIDERS: Record<
    AIProvider,
    { label: string; url: (encoded: string) => string; fallback: string; accent: string }
> = {
    chatgpt: {
        label: 'ChatGPT',
        url: (q) => `https://chatgpt.com/?q=${q}`,
        fallback: 'https://chatgpt.com/',
        accent: '#10a37f',
    },
    claude: {
        label: 'Claude',
        url: (q) => `https://claude.ai/new?q=${q}`,
        fallback: 'https://claude.ai/new',
        accent: '#cc785c',
    },
    grok: {
        label: 'Grok',
        url: (q) => `https://grok.com/?q=${q}`,
        fallback: 'https://grok.com/',
        accent: '#71717a',
    },
};

export function extractImageUrls(questionText: string): string[] {
    return [...questionText.matchAll(/!\[.*?\]\((.*?)\)/g)].map((m) => m[1] as string);
}

function labelledOptions(options: string[]): string {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    return options.map((opt, i) => `${labels[i] ?? i}) ${opt}`).join('\n');
}

function resolveCorrectAnswer(question: Question): string {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

    if (isNumericalQuestion(question)) {
        const ca = question.correct_answer;
        if (ca.type === 'exact') return String(ca.value);
        if (ca.type === 'multiple') return ca.values.join(', ');
        if (ca.type === 'range') return `between ${ca.min} and ${ca.max}`;
        if (ca.type === 'tolerance') return `${ca.value} ± ${ca.tolerance}`;
        return 'See solution';
    }

    const typeStr = question.question_type?.toLowerCase() || '';

    if (typeStr.includes('multiple')) {
        const q = question as MCQQuestion | MSQQuestion;
        if (!q.options || !Array.isArray(q.correct_answer)) return 'See solution';

        return q.correct_answer
            .map((idx: number) => `${labels[idx] ?? idx}) ${q.options[idx]}`)
            .join(', ');
    }

    return 'See solution';
}

export function buildGateAIPrompt(
    question: Question,
    imageCount = 0,
    userTemplate?: string,
    doubt?: string
): string {
    const isMCQ = question.question_type?.toLowerCase().includes('multiple-choice') ?? false;
    const q = question as MCQQuestion | MSQQuestion;

    let imagePlaceholder = '[Image — diagram not available]';
    if (imageCount === 1) imagePlaceholder = '[Diagram: see the image link above]';
    else if (imageCount > 1) imagePlaceholder = '[Diagrams: see the image links above]';

    const cleanQuestion = question.question
        .replace(/!\[.*?\]\(.*?\)/g, imagePlaceholder)
        .trim();

    const optionsBlock = isMCQ && q.options?.length
        ? `\nOPTIONS:\n${labelledOptions(q.options)}\n`
        : '';

    const correctAnswer = resolveCorrectAnswer(question);
    const doubtText = doubt?.trim() || '';
    const formattedDoubt = doubtText
        ? `\n\nUSER'S SPECIFIC DOUBT:\n"${doubtText}"\n\nPlease ensure you address this doubt specifically in your explanation.`
        : '';

    const template = userTemplate?.trim() ? userTemplate : DEFAULT_TEMPLATE;

    const replacements: Record<string, string> = {
        '{{SUBJECT}}': question.subject || 'Engineering',
        '{{YEAR}}': String(question.year),
        '{{TYPE}}': question.question_type || 'General',
        '{{QUESTION_TEXT}}': cleanQuestion,
        '{{OPTIONS}}': optionsBlock,
        '{{CORRECT_ANSWER}}': correctAnswer,
        '{{DOUBT}}': formattedDoubt,
    };

    let finalPrompt = template;
    Object.entries(replacements).forEach(([tag, value]) => {
        finalPrompt = finalPrompt.split(tag).join(value);
    });

    if (doubtText && !template.includes('{{DOUBT}}')) finalPrompt += formattedDoubt;

    return finalPrompt.trim();
}

export async function openInAI(
    question: Question,
    provider: AIProvider = 'chatgpt',
    aiCustomPrompt: string,
    doubt?: string
): Promise<void> {
    const config = AI_PROVIDERS[provider] || AI_PROVIDERS.chatgpt;

    const imageUrls = extractImageUrls(question.question);
    let prompt = buildGateAIPrompt(question, imageUrls.length, aiCustomPrompt, doubt);

    if (imageUrls.length > 0) {
        prompt = `DIAGRAM LINK(S):\n${imageUrls.join('\n')}\n\n${prompt}`;
    }

    const encoded = encodeURIComponent(prompt);

    try {
        // Long prompts get truncated by the provider's query-string handling, so hand
        // the user the full prompt on the clipboard instead.
        if (encoded.length > 4000) {
            await Clipboard.setStringAsync(prompt);
            await Linking.openURL(config.fallback);
            toast.info(`Prompt copied — paste it into ${config.label}.`);
            return;
        }

        await Linking.openURL(config.url(encoded));
    } catch (err) {
        console.error('[askAI] failed to open provider', err);
        await Clipboard.setStringAsync(prompt);
        toast.error(`Could not open ${config.label}. The prompt was copied instead.`);
    }
}
