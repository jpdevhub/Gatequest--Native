/**
 * Material 3 design tokens, dark scheme, tuned to the GATEQuest blue.
 *
 * Screens should pull colour, spacing, radius and type from here rather than
 * hard-coding hex values, so surfaces stay on one elevation ladder and touch
 * targets stay on one scale.
 */

export const md = {
    // ---- Colour roles -----------------------------------------------------
    color: {
        /** App background. */
        surface: '#0F172A',
        /** Cards sitting on the background. */
        surfaceContainerLow: '#151F33',
        surfaceContainer: '#1B2739',
        /** Raised rows, pressed states, chips. */
        surfaceContainerHigh: '#223047',
        surfaceContainerHighest: '#2A3A53',

        onSurface: '#E7EDF5',
        onSurfaceVariant: '#A8B6C9',
        onSurfaceDisabled: '#5A6B82',

        outline: '#415067',
        outlineVariant: '#2B3A50',

        primary: '#8AB4FF',
        onPrimary: '#0A2B60',
        primaryContainer: '#2B4C87',
        onPrimaryContainer: '#D8E4FF',

        secondaryContainer: '#2A3A53',
        onSecondaryContainer: '#D3E0F2',

        error: '#FFB4AB',
        errorContainer: '#5C1A16',
        onErrorContainer: '#FFDAD5',

        success: '#7FD69A',
        successContainer: '#14512C',
        onSuccessContainer: '#C8F2D4',

        warning: '#F5C464',
        warningContainer: '#54401A',
        onWarningContainer: '#FFE4B0',

        scrim: 'rgba(0,0,0,0.6)',
    },

    // ---- 4dp spacing scale -------------------------------------------------
    space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },

    // ---- Shape -------------------------------------------------------------
    radius: { xs: 4, sm: 8, md: 12, lg: 16, xl: 28, full: 999 },

    // ---- Type scale --------------------------------------------------------
    type: {
        headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
        titleLarge: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
        titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
        titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
        bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
        bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
        bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
        labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
        labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
        labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '600' as const },
    },

    /** Minimum Material touch target. */
    touchTarget: 48,
} as const;

/** Difficulty uses the semantic container roles so chips read consistently. */
export const difficultyChip = (difficulty?: string) => {
    const d = (difficulty || '').toLowerCase();
    if (d === 'easy') return { bg: md.color.successContainer, fg: md.color.onSuccessContainer };
    if (d === 'hard') return { bg: md.color.errorContainer, fg: md.color.onErrorContainer };
    if (d === 'medium' || d === 'normal')
        return { bg: md.color.warningContainer, fg: md.color.onWarningContainer };
    return { bg: md.color.surfaceContainerHigh, fg: md.color.onSurfaceVariant };
};
