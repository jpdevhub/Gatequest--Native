# GateQuest Native Implementation Plan

## Working assumptions

- `GateQuest-pwa` is the product and backend behavior reference.
- `Gatequest-Native` is the only repository changed during native implementation unless
  a PWA or Supabase change is explicitly approved.
- The native app should use the same production Supabase project and data model as the PWA.
- Mobile UI may adapt to native conventions; behavioral parity matters more than pixel parity.
- Android is the first release target because preview and production Android builds already
  exist in `eas.json`. iOS remains compatible but is not the first release gate.
- Each phase is completed and verified before the next phase starts.

## Current baseline

- Expo Router, TypeScript strict mode, Supabase, AsyncStorage, NativeWind, and EAS are present.
- Dashboard, practice landing, settings, about, login, and tab navigation UI exist.
- `npm run type-check` passes.
- Authentication is currently a development mock.
- Practice cards navigate to a route that does not exist yet.
- Dashboard smart actions currently point to the generic practice screen.
- Stats are only partially ported and report placeholder progress/count values.
- Supabase generated database types are not present in the native app.
- The EAS project ID is still a placeholder.
- There is no lint or test command in the native package.

## Phase 0: Stabilize the foundation

Goal: establish a reproducible, correctly configured project before adding product features.

Tasks:

- Decide whether to stabilize on Expo SDK 54 or perform a dedicated SDK 56 upgrade.
- Align `AGENTS.md`, Node version, Expo package versions, and CI with that decision.
- Confirm the native app uses the intended production Supabase project.
- Add startup validation for required public environment variables.
- Generate or share Supabase database types without manually duplicating the schema.
- Add lint and unit-test commands with the smallest useful configuration.
- Replace the placeholder EAS project ID with the real linked project configuration.
- Document local setup and build commands.

Verification:

- A clean install succeeds using the documented Node version.
- Expo dependency validation, TypeScript, lint, and the initial test suite pass.
- The app starts without mock credentials or missing configuration warnings.
- An Android development or preview build installs and opens.

Important decision:

The repository currently uses Expo SDK 54, React Native 0.81, and React 19.1, while
`AGENTS.md` requires SDK 56 documentation. SDK 56 targets newer React Native, React, and
Node versions. Treat the upgrade as an explicit task; do not copy SDK 56 APIs into the
SDK 54 app.

## Phase 1: Authentication and app lifecycle

Goal: a real user can securely sign in, restore a session, and sign out.

Tasks:

- Implement Google OAuth using Supabase's supported native deep-link flow.
- Configure the app scheme and provider redirect URLs.
- Restore the Supabase session at startup without retry loops or mock users.
- Upsert and cache the user profile consistently with the PWA.
- Clear user-scoped native data on logout.
- Keep protected route redirects deterministic during auth loading.

Verification:

- Fresh install -> Google login -> dashboard works.
- Force-close -> reopen restores the authenticated session.
- Logout clears the session and returns to login.
- Cancelled and failed login attempts show a useful non-blocking error.

## Phase 2: Shared domain and local data layer

Goal: native features use typed, testable data services rather than UI-bound queries.

Tasks:

- Port only the shared domain types required by the next feature.
- Add small feature-level API/repository functions around Supabase queries.
- Define storage ownership for profile, settings, question cache, sessions, and attempts.
- Add a native event or query refresh mechanism for stats updates.
- Preserve backend behavior and row-level security assumptions from the PWA.

Verification:

- Data functions have focused tests for mapping, filtering, and failure states.
- UI components do not duplicate Supabase query logic.
- User-scoped cached data cannot leak across logout/login.

## Phase 3: Practice flow

Goal: a user can select a subject, answer questions, and resume progress.

Tasks:

- Add subject question-list and question-detail routes.
- Port question fetching, filters, pagination, and bookmark behavior.
- Implement native renderers for text, code, tables, math, and remote images.
- Port answer selection, correctness, explanation, timer, and activity persistence.
- Add session resume and offline-safe attempt syncing.

Verification:

- Subject -> list -> question navigation has no missing routes.
- Supported question types render correctly on a physical Android device.
- Answer attempts persist once and update dashboard data.
- A partially completed session resumes after an app restart.

## Phase 4: Dashboard parity

Goal: dashboard metrics reflect real production data.

Tasks:

- Port exam question-count RPC caching.
- Complete progress, accuracy, streak, heatmap, study plan, and subject metrics.
- Connect continue-session, topic-test, and smart-revision actions to real routes.
- Handle empty, loading, offline, and failed states.

Verification:

- Metrics match the PWA for the same user and active goal.
- Pull-to-refresh or the chosen refresh action updates all dashboard sections.
- No metric remains hard-coded or placeholder-only.

## Phase 5: Settings, goals, account, and static pages

Goal: users can manage the settings required by the native product.

Tasks:

- Complete branch and exam goal selection.
- Persist settings locally and to Supabase with visible sync state.
- Add account and privacy behavior that applies to native.
- Keep web-only settings out of native unless a mobile equivalent exists.
- Finish about and donation flows using native-safe links.

Verification:

- Goal changes update practice subjects and dashboard metrics.
- Settings survive restart and agree with the server profile.
- External links open safely and failed opens are handled.

## Phase 6: Smart revision

Goal: users can generate and complete weekly revision sets.

Tasks:

- Port current-set loading and generation behavior.
- Add revision list and question routes.
- Persist revision answers and completion status.
- Refresh dashboard stats after revision activity.

Verification:

- Revision state matches the PWA for the same user.
- Interrupted revision sessions resume correctly.
- Completion updates Supabase exactly once.

## Phase 7: Topic tests

Goal: users can configure, take, submit, and review a topic test.

Tasks:

- Port topic count and test-generation RPC flows.
- Implement lobby, timed test session, question palette, and controls.
- Persist active tests safely across app backgrounding and termination.
- Add result and solution review routes.

Verification:

- A generated test can be completed end to end.
- Timer and answers recover after backgrounding or restart.
- Submission is idempotent and results match PWA grading.

## Phase 8: Release readiness

Goal: produce a monitored, store-ready Android release.

Tasks:

- Add automated type-check, lint, tests, and build validation.
- Configure production app identity, icons, splash, signing, and EAS metadata.
- Add crash/error reporting and a minimal privacy review.
- Test supported Android versions, slow networks, offline behavior, and upgrades.
- Prepare release notes and a rollback plan.

Verification:

- CI passes from a clean checkout.
- Signed preview and production builds install successfully.
- Critical user journeys pass on physical Android devices.
- No development bypasses, placeholder IDs, or debug credentials remain.

## Rules for every phase

1. Define the phase's smallest shippable behavior.
2. Record assumptions and unresolved decisions before coding.
3. Add or update verification before broadening scope.
4. Keep diffs limited to the active phase.
5. Compare behavior with the PWA using the same account and backend.
6. Do not begin the next phase while known release-blocking failures remain.
