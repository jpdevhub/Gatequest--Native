/**
 * Support channel.
 *
 * WhatsApp rather than an in-app form: users can send a screenshot or a voice
 * note straight from a chat they already trust, and there is no vendor account
 * to maintain. The number comes from EXPO_PUBLIC_SUPPORT_WHATSAPP (digits only,
 * including country code, e.g. 919876543210).
 */
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import { toast } from 'sonner-native';

const SUPPORT_NUMBER = (process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP ?? '').replace(/\D/g, '');

export const isSupportConfigured = () => SUPPORT_NUMBER.length > 0;

export type SupportContext = {
    /** Short label for what the user was doing, e.g. "Question report". */
    topic?: string;
    questionId?: string;
};

function buildMessage({ topic, questionId }: SupportContext = {}): string {
    const version = Constants.expoConfig?.version ?? 'dev';
    const lines = [
        `Hi GATEQuest team — I need help with: ${topic ?? 'the app'}.`,
        '',
        'My message:',
        '',
        '---',
        `App ${version} · ${Platform.OS}`,
    ];
    if (questionId) lines.splice(1, 0, `Question ID: ${questionId}`);
    return lines.join('\n');
}

/** Opens a WhatsApp chat with the support number, message pre-filled. */
export async function openSupportChat(context?: SupportContext): Promise<void> {
    if (!isSupportConfigured()) {
        toast.error('Support chat is not configured yet.');
        return;
    }

    const url = `https://wa.me/${SUPPORT_NUMBER}?text=${encodeURIComponent(buildMessage(context))}`;

    try {
        await Linking.openURL(url);
    } catch (err) {
        console.error('[support] failed to open WhatsApp', err);
        toast.error('Could not open WhatsApp. Is it installed?');
    }
}
