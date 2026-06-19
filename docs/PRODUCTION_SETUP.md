# Production Setup

## Architecture

The app talks directly to its own Supabase project for authentication and database access.
There is no separately hosted application backend.

Only these values may be included in the mobile bundle:

- Supabase project URL
- Supabase publishable key

Never include a Supabase secret/service-role key, Google client secret, model provider key, or
cron secret in an `EXPO_PUBLIC_*` variable.

## 1. Runtime

Use Node.js 22.13 or newer, below Node.js 25.

```sh
npm ci
npm run type-check
npm run lint
npx expo-doctor
```

The project is aligned to Expo SDK 56.

## 2. Create the separate Supabase project

Create a new Supabase project for the native app, then link and apply the copied PWA schema:

```sh
npx supabase login
npx supabase link --project-ref YOUR_NATIVE_PROJECT_REF
npx supabase db push
```

The migration history in `supabase/migrations` is copied from the PWA repository through
May 23, 2026. The final native hardening migration:

- removes anonymous access to maintenance functions;
- fixes `SECURITY DEFINER` search paths;
- disables PWA reminder/web-push jobs that have no native Edge Function deployment.

The migrations copy schema and static catalog rows included by the PWA migrations. They do not
copy production user accounts, attempts, auth users, or other live database data.

After each database change, regenerate native types:

```sh
npx supabase gen types typescript --linked > src/shared/types/supabase.ts
```

## 3. Configure the app environment

Create `.env` from `.env.example`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

The app fails at startup when either value is missing. This is intentional.

For EAS builds, set the same values as EAS environment variables rather than committing `.env`.

## 4. Configure Google OAuth

In Google Cloud:

1. Create the OAuth consent screen.
2. Add only `openid`, email, and profile scopes.
3. Create the web OAuth client used by Supabase.
4. Add the callback URL shown on the Supabase Google provider page.

In the native Supabase project:

1. Enable the Google provider and set its client ID and secret from the Google **Web application** OAuth client.
2. Add the exact `gatequest://auth/callback` URL to the Auth redirect allow list.
3. Keep anonymous sign-in disabled.
4. Keep refresh-token rotation enabled.

The app uses `gatequest://auth/callback`.

### Why the Google Web client is required

The app starts Google sign-in in the system browser. Google redirects to Supabase at
`https://YOUR_NATIVE_PROJECT_REF.supabase.co/auth/v1/callback`; Supabase exchanges the code and
then deep-links into the app at `gatequest://auth/callback`. That first callback is why the Google
provider is configured with a **Web application** client and its client secret.

Create an additional Google **Android** OAuth client with package `com.gatequest.app` and the
debug/release SHA-1 certificate fingerprints if you want Android application identity registered
in Google Cloud or later move to Google Credential Manager/native ID-token sign-in. It has no
redirect URI and is not used by the current Supabase browser OAuth code.

For local Supabase only, set these non-public shell variables before starting Supabase:

```sh
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...
```

Then set `[auth.external.google].enabled` to `true` in `supabase/config.toml`.

## 5. Abuse and overload controls

Before production launch:

- Review Supabase Auth rate limits for expected traffic.
- Enable CAPTCHA if email/password, OTP, or anonymous signup is added later.
- Keep RLS enabled on every user-owned table.
- Require `auth.uid()` ownership checks in write policies and RPCs.
- Put limits on list queries and avoid unrestricted realtime subscriptions.
- Add database indexes only from measured query plans.
- Set billing and usage alerts in Supabase and the model provider.

The publishable key is intentionally public. Security comes from RLS, function permissions,
validation, and rate limits—not from hiding that key.

## 6. Model calls

Do not call a paid model provider from the mobile app using an app-owned secret key. APK/IPA
contents and network traffic can be inspected, so such a key will eventually be stolen and abused.

Use one of these designs:

- a Supabase Edge Function that verifies the Supabase JWT, validates input, rate-limits by user,
  enforces timeouts and token limits, and reads the model key from function secrets; or
- user-supplied provider keys stored securely for calls billed to that user.

The first option is the production recommendation even though it is a small server-side relay.

## 7. Remaining release configuration

Replace `YOUR_EAS_PROJECT_ID` in `app.json` after running:

```sh
eas init
```

Before store submission, also verify the final Android package name, iOS bundle identifier,
signing credentials, privacy disclosures, and physical-device OAuth flow.
