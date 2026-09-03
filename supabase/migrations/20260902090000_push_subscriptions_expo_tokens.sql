-- The native app registers Expo push tokens, which do not have the web-push
-- endpoint/auth/p256dh shape. Widen push_subscriptions to carry both.

alter table public.push_subscriptions
    add column if not exists expo_push_token text,
    add column if not exists platform text;

alter table public.push_subscriptions
    alter column auth_key drop not null,
    alter column p256dh_key drop not null;

create unique index if not exists push_subscriptions_expo_push_token_key
    on public.push_subscriptions (expo_push_token)
    where expo_push_token is not null;

-- A row must identify itself either as a web-push subscription or an Expo one.
alter table public.push_subscriptions
    drop constraint if exists push_subscriptions_transport_check;

alter table public.push_subscriptions
    add constraint push_subscriptions_transport_check check (
        (expo_push_token is not null)
        or (auth_key is not null and p256dh_key is not null)
    );

-- Users manage their own rows; the existing RLS policies cover select/insert/delete.
-- Dropped first so re-running this migration after a partial push is safe.
drop policy if exists "Users can update own subscriptions" on public.push_subscriptions;

create policy "Users can update own subscriptions"
on public.push_subscriptions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
