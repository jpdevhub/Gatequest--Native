-- Harden inherited production objects without rewriting their migration history.

-- Anonymous callers must never execute write/maintenance functions directly.
revoke execute on function public.insert_user_question_activity_batch(jsonb) from anon;
revoke execute on function public.refresh_question_peer_stats() from anon, authenticated;

-- This project does not deploy the PWA reminder/web-push Edge Functions.
drop trigger if exists trigger_on_report_insert on public.question_reports;
drop trigger if exists trigger_on_report_update on public.question_reports;

select cron.unschedule(jobid)
from cron.job
where jobname in (
    'revision-hourly-reminder',
    'weekend-topic-test-saturday',
    'weekend-topic-test-sunday',
    'donation-reminder-every-2-weeks'
);

-- SECURITY DEFINER functions must not inherit a caller-controlled search path.
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
    loop
        execute format(
            'alter function %s set search_path = public, pg_temp',
            function_record.function_signature
        );
    end loop;
end
$$;
