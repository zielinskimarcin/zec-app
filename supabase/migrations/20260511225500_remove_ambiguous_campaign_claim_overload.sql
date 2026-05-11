drop function if exists public.zec_claim_due_campaign_emails(integer, uuid);

revoke execute on function public.zec_claim_due_campaign_emails(integer, uuid, text) from anon;
grant execute on function public.zec_claim_due_campaign_emails(integer, uuid, text) to anon;
grant execute on function public.zec_claim_due_campaign_emails(integer, uuid, text) to service_role;
