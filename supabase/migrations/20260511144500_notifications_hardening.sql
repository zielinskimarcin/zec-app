create or replace function public.zec_touch_notification_settings()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "notification_settings_select_own" on public.notification_settings;
create policy "notification_settings_select_own"
  on public.notification_settings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "notification_settings_insert_own" on public.notification_settings;
create policy "notification_settings_insert_own"
  on public.notification_settings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "notification_settings_update_own" on public.notification_settings;
create policy "notification_settings_update_own"
  on public.notification_settings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "app_notifications_select_own" on public.app_notifications;
create policy "app_notifications_select_own"
  on public.app_notifications
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on function public.zec_touch_notification_settings() from public, anon, authenticated;
revoke all on function public.zec_insert_notification(uuid, text, text, text, text, text, uuid, text, jsonb, text) from public, anon, authenticated;

revoke all on function public.zec_notify_user(text, text, text, text, text, uuid, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.zec_notify_user(text, text, text, text, text, uuid, text, jsonb, text) to authenticated;

revoke all on function public.zec_mark_notification_read(uuid) from public, anon, authenticated;
grant execute on function public.zec_mark_notification_read(uuid) to authenticated;

revoke all on function public.zec_mark_all_notifications_read() from public, anon, authenticated;
grant execute on function public.zec_mark_all_notifications_read() to authenticated;

revoke all on function public.zec_notify_profile_welcome() from public, anon, authenticated;
revoke all on function public.zec_notify_low_credits() from public, anon, authenticated;
revoke all on function public.zec_notify_campaign_email_event() from public, anon, authenticated;
revoke all on function public.zec_notify_campaign_completed() from public, anon, authenticated;
revoke all on function public.zec_notify_mailbox_status_event() from public, anon, authenticated;
