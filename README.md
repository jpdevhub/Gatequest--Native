# GATEQuest — Android app

Practice GATE past questions, take timed topic tests, and revise what you got wrong.
React Native client for the same Supabase backend as the [GATEQuest PWA](https://gatequest.in).

---

## Stack

| Layer | Choice |
|---|---|
| Runtime | Expo SDK 56, React Native 0.85, React 19 |
| Routing | Expo Router (typed routes) |
| Backend | Supabase — Postgres, Auth, RLS, RPCs |
| Styling | React Native `StyleSheet` on Material 3 tokens (`src/shared/theme/material.ts`) |
| Local store | JSON documents on the filesystem (`src/shared/storage/appStorage.ts`) |
| Maths | KaTeX, bundled offline and rendered in a WebView / iframe |

---

## Getting started

Requires Node 22.13 or newer (below 25).

```sh
npm install
cp .env.example .env      # fill in the Supabase values
npm start
```

| Variable | Required | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Supabase publishable (anon) key |
| `EXPO_PUBLIC_SUPPORT_WHATSAPP` | no | Support number, digits only, e.g. `919876543210` |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | no | Proxies question images for faster loading |

Everything prefixed `EXPO_PUBLIC_` is compiled into the bundle and is therefore
public. Never put a service-role key, OAuth client secret, or cron secret there.

### Commands

```sh
npm start            # Expo dev server
npm run android      # dev server, opened on a connected device
npm run type-check   # tsc --noEmit
npm run lint         # eslint
```

---

## Project layout

```
app/                      Expo Router routes only — screens stay thin
  (auth)/login            Onboarding + Google sign-in
  (tabs)/                 Home · Practice · Revision · Tests · Settings
  practice/[subject]/     Question list and question screen
  revision/[rid]/         Weekly revision set
  topic-test/[testId]/    Lobby, timed session, result, solution review

src/
  features/<domain>/      api · hooks · components · screens per feature
  shared/
    components/md/        Material primitives (Button, IconButton, Chip, dialogs)
    components/renderers/ Question content pipeline (see below)
    storage/              File-backed local database
    theme/material.ts     Design tokens — colour, spacing, shape, type

supabase/migrations/      Schema, RPCs and RLS policies
scripts/seed-questions.mjs Seeds public.questions from docs/mega.json
```

---

## How question rendering works

GATE questions contain LaTeX, C code, markdown tables and images. React Native
cannot typeset any of that, so content is compiled to HTML and rendered in a
single embedded browser view with KaTeX inlined — no CDN, so it works offline.

1. `contentHtml.ts` parses raw question text into HTML (maths, code with
   highlighting, markdown and LaTeX tables, lists, images).
2. `webviewShell.ts` wraps it with the KaTeX stylesheet and script.
3. `HtmlView` renders it — a `WebView` on native, an `iframe` on web, both
   speaking one message protocol for height and option taps.

Two decisions matter for performance:

- **A question and all of its options render in one document.** Selection state
  is pushed in with `applyState`, so tapping an option never reloads or
  re-typesets anything.
- **Plain prose skips the embedded view entirely** and renders as native `Text`.
  Across the question bank that is roughly 38% of all strings.

---

## Data flow

Questions live in Supabase and are cached locally per subject, with an hourly
delta sync on `updated_at` — so a subject opens instantly and keeps working
offline after its first load.

Answers are written to a local buffer first and then synced, so a failed request
never loses an attempt. Smart Revision and Topic Test are server-side RPCs
(`generate_weekly_revision_set`, `generate_topic_test`, `submit_test_grading`),
which keeps grading authoritative and identical to the PWA.

### Seeding the question bank

```sh
EXPO_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/seed-questions.mjs           # validate only
  node scripts/seed-questions.mjs --apply   # write
```

Idempotent — it upserts on the primary key.

---

## Releases

`.github/workflows/build-apk.yml` type-checks and lints, then builds an APK with
`expo prebuild` + Gradle.

- Without `ANDROID_KEYSTORE_BASE64`, it uploads an unsigned **debug** APK.
- With the keystore secrets set, it builds and signs a **release** APK.

Required repository secrets:

| Secret | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Bundled config |
| `EXPO_PUBLIC_SUPPORT_WHATSAPP`, `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Optional |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD` | Signing |

Bump `expo.android.versionCode` in `app.json` for every Play Store upload.

### Known gaps

- Push notifications need a real `expo.extra.eas.projectId` and a
  `google-services.json`. Local daily reminders already work without either.
- `docs/mega.json` is CS-only, so non-CS branches have subjects but no questions
  until their papers are imported.

---

## Contributing

See `CLAUDE.md` for the engineering guidelines this repository follows, and
`docs/ARCHITECTURE.md` for how the native app maps onto the PWA.

## Licence

MIT.
