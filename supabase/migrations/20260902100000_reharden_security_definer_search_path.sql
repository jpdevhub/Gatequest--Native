-- 20260619000000_native_security_hardening.sql pins search_path on every
-- SECURITY DEFINER function, but it ran before the PWA migrations dated
-- 2026-05-28 .. 2026-08-08 were applied to this project. Those migrations added
-- and replaced definer functions (get_my_dashboard, get_user_attempted_ids,
-- the bookmark RPCs, get_public_profile, internal_calc_*), which are therefore
-- running with a caller-controlled search_path.
--
-- Re-run the same loop so the guarantee holds for the current function set.

do $$
declare
    function_record record;
begin
    for function_record in
        select p.oid::regprocedure as function_signature
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.prosecdef
          and not exists (
              select 1
              from unnest(coalesce(p.proconfig, '{}')) as cfg
              where cfg like 'search_path=%'
          )
    loop
        execute format(
            'alter function %s set search_path = public, pg_temp',
            function_record.function_signature
        );
    end loop;
end
$$;
