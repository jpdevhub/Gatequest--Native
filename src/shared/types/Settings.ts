export type AIProvider = 'chatgpt' | 'claude' | 'grok';

export type Settings = {
    sound: boolean;
    autoTimer: boolean;
    darkMode: boolean;
    // Which AI provider to deep-link to for question explanations
    aiProvider: AIProvider;
    aiCustomPrompt: string;
    notifications: boolean;
    dailyReminderHour: number;
    shareProgress: boolean;
    dataCollection: boolean;
};
