/**
 * OAuth landing route.
 *
 * Google redirects to `gatequest://auth/callback`, which Android delivers to the
 * app as a deep link, so Expo Router navigates here. Without this route the
 * redirect lands on +not-found even though sign-in succeeded.
 *
 * In the normal warm flow AuthProvider has already exchanged the tokens from
 * the in-app browser result; this screen then just waits for auth state and
 * forwards. When the deep link cold-starts the app there is nobody to consume
 * the tokens, so it completes the exchange itself.
 */
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { ModernLoader } from '@/shared/components/ModernLoader';
import { supabase } from '@/shared/utils/supabaseClient';

export default function AuthCallback() {
    const { isLogin, loading } = useAuth();
    const url = Linking.useURL();
    const [settling, setSettling] = useState(true);

    useEffect(() => {
        let active = true;

        const settle = async () => {
            try {
                const { data } = await supabase.auth.getSession();

                if (!data.session && url) {
                    const { params, errorCode } = QueryParams.getQueryParams(url);

                    if (errorCode) {
                        console.error('[auth] callback returned an error:', errorCode);
                    } else if (
                        typeof params.access_token === 'string' &&
                        typeof params.refresh_token === 'string'
                    ) {
                        // setSession is idempotent, so re-applying the same tokens
                        // after the warm flow already did is harmless.
                        await supabase.auth.setSession({
                            access_token: params.access_token,
                            refresh_token: params.refresh_token,
                        });
                    }
                }
            } catch (err) {
                console.error('[auth] callback failed to restore the session', err);
            } finally {
                if (active) setSettling(false);
            }
        };

        void settle();
        return () => {
            active = false;
        };
    }, [url]);

    if (settling || loading) return <ModernLoader />;

    return <Redirect href={isLogin ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}
