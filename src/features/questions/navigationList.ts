/**
 * navigationList — carries the currently filtered question order from a list screen
 * to the question screen.
 *
 * Expo Router cannot pass objects between routes, and re-deriving the filtered order
 * from route params would drop the user's filters. This module-level handoff keeps
 * next/prev walking the same list the user was looking at.
 */
let scopeKey: string | null = null;
let orderedIds: string[] = [];

export function setNavigationList(scope: string, ids: string[]): void {
    scopeKey = scope;
    orderedIds = ids;
}

export function getNavigationList(scope: string): string[] | null {
    return scopeKey === scope ? orderedIds : null;
}

export function clearNavigationList(): void {
    scopeKey = null;
    orderedIds = [];
}
