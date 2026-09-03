# Architecture

Reference app: `../GateQuest-pwa`. Behaviour parity matters more than pixel parity;
where the two differ, the reason is noted.

## Data layer

The native app reads questions from the **Supabase `questions` table with a local
file cache**, the same source the PWA uses — not from `docs/mega.json`.

`mega.json` was a CS-only snapshot (3,860 questions) with no `subject_id` and no
`answer_text`, so it could not serve EC/EE/ME/DA users, could not record attempts
(the activity RPC needs `subject_id`), and carried no explanations. Smart Revision
and Topic Test also return question rows straight from the database, which would
not have resolved against it. `src/shared/utils/questionStore.ts` and
`src/shared/types/Question.ts` were removed; `docs/mega.json` is left on disk as a
data export but is no longer bundled into the app.

| Concern | PWA | Native |
|---|---|---|
| Question cache | Dexie / IndexedDB | `src/shared/storage/appStorage.ts` (JSON docs on the filesystem) |
| Delta sync | `updated_at` per subject, hourly | same |
| Attempt buffer | localStorage | `appStorage`, retried on the next answer |
| Cross-component events | `window.dispatchEvent` | `src/shared/utils/appEvents.ts` |

## Content rendering

`src/shared/components/renderers/contentHtml.ts` turns raw question text into HTML;
`webviewShell.ts` wraps it with KaTeX inlined from `react-native-katex` (offline — no CDN).

- A question and **all of its options render in one WebView** (`QuestionContent`).
  Selection state is pushed in with `applyState`, so tapping an option never
  reloads or re-typesets the document.
- Plain prose skips the WebView entirely and renders as native `<Text>`.
  Across the 17,281 real question/option strings in the bank, 38% take that path.
- Supported: inline and display LaTeX, fenced and inline code (with highlighting),
  markdown tables, LaTeX `tabular`, `<ul>` lists, inline HTML, and markdown images
  (optionally proxied through Cloudinary via `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`).

## Screens

| Feature | Route | Status |
|---|---|---|
| Login (Google OAuth) | `(auth)/login` | pre-existing |
| Dashboard | `(tabs)/dashboard` | live data via `get_my_dashboard`, pull-to-refresh |
| Practice subjects | `(tabs)/practice` | real per-subject progress and accuracy |
| Question list | `practice/[subject]` | search, attempt filter, faceted filters |
| Question screen | `practice/[subject]/[qid]` | full answer flow, timer, bookmark, peer stats, explanation, Ask AI |
| Bookmarks | `practice/bookmarks` | all subjects |
| Smart Revision | `(tabs)/revision`, `revision/[rid]`, `revision/[rid]/[qid]` | generate, start, answer |
| Topic Test | `(tabs)/topic-test`, `topic-test/generate`, `topic-test/[testId]`, `.../attempt`, `.../result`, `.../review/[qIndex]` | generate, timed session, palette, grading, report, solutions |
| Settings | `(tabs)/settings` | goals, preferences, reminders, privacy |
| About | `about` | reached from Settings |

Tabs are Home · Practice · Revision · Tests · Settings. About moved out of the tab
bar to keep five tabs readable on a phone.

## Navigation difference

The PWA changes route on every next/prev and passes the filtered question list
through router state. Expo Router has no route state and re-mounting a screen per
question is slow, so `useQuestionController` walks the list in place and
`src/features/questions/navigationList.ts` hands the filtered order from the list
screen to the question screen. A cold open (deep link, "continue where you left
off") falls back to the full subject list.

## Notifications

`src/features/notifications/` requests permission, schedules a **local** daily
reminder at the hour chosen in Settings, registers an Expo push token, and routes
notification taps.

Two things are still needed before server-sent pushes work:

1. `app.json` still has `extra.eas.projectId: "YOUR_EAS_PROJECT_ID"`. Token
   registration is skipped until that is the real project id.
2. `supabase/migrations/20260619000000_native_security_hardening.sql` unschedules
   the PWA's reminder cron jobs, and the Edge Function still targets the Web Push
   API. Migration `20260902090000_push_subscriptions_expo_tokens.sql` widens
   `push_subscriptions` to carry Expo tokens; pointing the function at
   `https://exp.host/--/api/v2/push/send` and rescheduling the jobs is the
   remaining server-side work.

## Not ported

- Donations, public profiles (`/u/:username`), landing page, changelog, presence
  ("N studying now"), and account deletion — web-only or out of scope for this pass.
- Keyboard shortcuts (no keyboard on mobile).
- The PWA's in-test scientific calculator iframe.

## Rendering across platforms

`react-native-webview` has no web implementation, so `HtmlView` splits by
platform: `HtmlView.tsx` uses a WebView, `HtmlView.web.tsx` uses an iframe. Both
speak the same message protocol defined in `webviewShell.ts`, so `RichText` and
`QuestionContent` never branch on platform themselves.

## Design system

`src/shared/theme/material.ts` holds Material 3 tokens — colour roles, a 4dp
spacing scale, shape and type scales. Screens compose the primitives in
`src/shared/components/md/` rather than hard-coding hex values, which keeps
surfaces on one elevation ladder and touch targets at 48dp.

`Alert.alert` is not used anywhere: react-native-web does not implement it, so
confirmations go through `md/ConfirmDialog`.

## Verification

- `npm run type-check` — clean
- `npm run lint` — 0 problems
- `expo export` — Android and web both bundle
- Content renderer exercised against all 17,281 question/option strings: 0 failures
- Every RPC exercised end to end against the live project as an authenticated
  test user, including test generation, grading and dashboard aggregation
