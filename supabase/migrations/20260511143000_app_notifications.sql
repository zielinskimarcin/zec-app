create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  welcome boolean not null default true,
  campaign_finished boolean not null default true,
  generation_finished boolean not null default true,
  email_skipped boolean not null default true,
  email_failed boolean not null default true,
  new_reply boolean not null default true,
  low_credits boolean not null default true,
  mailbox_error boolean not null default true,
  product_updates boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  severity text not null default 'info' check (severity in ('info', 'success', 'warning', 'error')),
  entity_type text,
  entity_id uuid,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_notifications_user_created_idx
  on public.app_notifications (user_id, created_at desc);

create index if not exists app_notifications_user_unread_idx
  on public.app_notifications (user_id, read_at)
  where archived_at is null;

create unique index if not exists app_notifications_user_dedupe_idx
  on public.app_notifications (user_id, dedupe_key)
  where dedupe_key is not null;

alter table public.notification_settings enable row level security;
alter table public.app_notifications enable row level security;

drop policy if exists "notification_settings_select_own" on public.notification_settings;
create policy "notification_settings_select_own"
  on public.notification_settings
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notification_settings_insert_own" on public.notification_settings;
create policy "notification_settings_insert_own"
  on public.notification_settings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "notification_settings_update_own" on public.notification_settings;
create policy "notification_settings_update_own"
  on public.notification_settings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "app_notifications_select_own" on public.app_notifications;
create policy "app_notifications_select_own"
  on public.app_notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update on public.notification_settings to authenticated;
grant select on public.app_notifications to authenticated;

create or replace function public.zec_touch_notification_settings()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notification_settings_touch_updated_at on public.notification_settings;
create trigger notification_settings_touch_updated_at
  before update on public.notification_settings
  for each row
  execute function public.zec_touch_notification_settings();

create or replace function public.zec_insert_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_severity text default 'info',
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_action_url text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_dedupe_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_settings public.notification_settings%rowtype;
  v_type text := nullif(btrim(coalesce(p_type, '')), '');
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_severity text := coalesce(nullif(btrim(p_severity), ''), 'info');
  v_dedupe_key text := nullif(btrim(coalesce(p_dedupe_key, '')), '');
  v_enabled boolean := true;
begin
  if p_user_id is null or v_type is null or v_title is null then
    return null;
  end if;

  if v_severity not in ('info', 'success', 'warning', 'error') then
    v_severity := 'info';
  end if;

  insert into public.notification_settings (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into v_settings
  from public.notification_settings
  where user_id = p_user_id;

  v_enabled := case v_type
    when 'welcome' then v_settings.welcome
    when 'campaign_finished' then v_settings.campaign_finished
    when 'campaign_generation_finished' then v_settings.generation_finished
    when 'campaign_email_skipped' then v_settings.email_skipped
    when 'campaign_email_failed' then v_settings.email_failed
    when 'campaign_email_bounced' then v_settings.email_failed
    when 'new_reply' then v_settings.new_reply
    when 'low_credits' then v_settings.low_credits
    when 'mailbox_error' then v_settings.mailbox_error
    when 'product_update' then v_settings.product_updates
    else true
  end;

  if not coalesce(v_enabled, true) then
    return null;
  end if;

  insert into public.app_notifications (
    user_id,
    type,
    title,
    body,
    severity,
    entity_type,
    entity_id,
    action_url,
    metadata,
    dedupe_key
  )
  values (
    p_user_id,
    v_type,
    v_title,
    nullif(btrim(coalesce(p_body, '')), ''),
    v_severity,
    nullif(btrim(coalesce(p_entity_type, '')), ''),
    p_entity_id,
    nullif(btrim(coalesce(p_action_url, '')), ''),
    coalesce(p_metadata, '{}'::jsonb),
    v_dedupe_key
  )
  on conflict (user_id, dedupe_key) where dedupe_key is not null
  do update set
    type = excluded.type,
    title = excluded.title,
    body = excluded.body,
    severity = excluded.severity,
    entity_type = excluded.entity_type,
    entity_id = excluded.entity_id,
    action_url = excluded.action_url,
    metadata = excluded.metadata,
    archived_at = null,
    read_at = null,
    created_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.zec_insert_notification(uuid, text, text, text, text, text, uuid, text, jsonb, text) from public;
revoke all on function public.zec_insert_notification(uuid, text, text, text, text, text, uuid, text, jsonb, text) from anon;
revoke all on function public.zec_insert_notification(uuid, text, text, text, text, text, uuid, text, jsonb, text) from authenticated;

create or replace function public.zec_notify_user(
  p_type text,
  p_title text,
  p_body text default null,
  p_severity text default 'info',
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_action_url text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_dedupe_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  return public.zec_insert_notification(
    v_user_id,
    p_type,
    p_title,
    p_body,
    p_severity,
    p_entity_type,
    p_entity_id,
    p_action_url,
    p_metadata,
    p_dedupe_key
  );
end;
$$;

grant execute on function public.zec_notify_user(text, text, text, text, text, uuid, text, jsonb, text) to authenticated;

create or replace function public.zec_mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.app_notifications
  set read_at = coalesce(read_at, now())
  where id = p_notification_id
    and user_id = v_user_id
    and archived_at is null;
end;
$$;

grant execute on function public.zec_mark_notification_read(uuid) to authenticated;

create or replace function public.zec_mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.app_notifications
  set read_at = coalesce(read_at, now())
  where user_id = v_user_id
    and archived_at is null
    and read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.zec_mark_all_notifications_read() to authenticated;

create or replace function public.zec_notify_profile_welcome()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.zec_insert_notification(
    new.id,
    'welcome',
    'Witaj w ZEC',
    'Podłącz skrzynkę, wyszukaj pierwsze leady i zbuduj kampanię.',
    'success',
    'profile',
    new.id,
    '/app',
    jsonb_build_object('source', 'profile_created'),
    'welcome:' || new.id::text
  );

  return new;
end;
$$;

drop trigger if exists profiles_notify_welcome on public.profiles;
create trigger profiles_notify_welcome
  after insert on public.profiles
  for each row
  execute function public.zec_notify_profile_welcome();

create or replace function public.zec_notify_low_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_monthly_credits integer := 0;
  v_threshold integer := 1;
begin
  if coalesce(new.credits, 0) >= coalesce(old.credits, 0) then
    return new;
  end if;

  select coalesce(bp.monthly_credits, 0)
  into v_monthly_credits
  from public.user_billing ub
  left join public.billing_plans bp on bp.id = ub.plan_id
  where ub.user_id = new.id;

  if coalesce(v_monthly_credits, 0) <= 0 then
    v_monthly_credits := greatest(coalesce(old.credits, 0), coalesce(new.credits, 0), 100);
  end if;

  v_threshold := greatest(1, ceil(v_monthly_credits::numeric * 0.1)::integer);

  if coalesce(new.credits, 0) <= v_threshold and coalesce(old.credits, 0) > v_threshold then
    perform public.zec_insert_notification(
      new.id,
      'low_credits',
      'Niski stan tokenów',
      format('Zostało %s z %s tokenów w bieżącym limicie.', greatest(coalesce(new.credits, 0), 0), v_monthly_credits),
      'warning',
      'billing',
      null,
      '/app/settings',
      jsonb_build_object('credits_left', coalesce(new.credits, 0), 'monthly_credits', v_monthly_credits),
      'low_credits:' || new.id::text || ':' || to_char(now(), 'YYYY-MM')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_notify_low_credits on public.profiles;
create trigger profiles_notify_low_credits
  after update of credits on public.profiles
  for each row
  execute function public.zec_notify_low_credits();

create or replace function public.zec_notify_campaign_email_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign record;
  v_lead record;
  v_label text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  select id, user_id, name
  into v_campaign
  from public.campaigns
  where id = new.campaign_id;

  if v_campaign.user_id is null then
    return new;
  end if;

  select
    coalesce(gl.company_name, ul.name, gl.email, 'Lead') as company_name,
    coalesce(gl.email, '') as email
  into v_lead
  from public.user_leads ul
  left join public.global_leads gl on gl.id = ul.global_lead_id
  where ul.id = new.lead_id;

  v_label := coalesce(nullif(v_lead.company_name, ''), 'Lead');

  if new.status = 'failed' then
    if old.status = 'processing' or nullif(new.last_error, '') is not null then
      perform public.zec_insert_notification(
        v_campaign.user_id,
        'campaign_email_failed',
        'Nie udało się wysłać maila',
        format('%s w kampanii "%s". %s', v_label, v_campaign.name, coalesce(nullif(new.last_error, ''), 'Wiadomość została oznaczona jako błąd wysyłki.')),
        'error',
        'campaign',
        v_campaign.id,
        '/app/campaigns',
        jsonb_build_object('campaign_id', v_campaign.id, 'email_id', new.id, 'lead_id', new.lead_id, 'last_error', new.last_error),
        'campaign_email_failed:' || new.id::text
      );
    else
      perform public.zec_insert_notification(
        v_campaign.user_id,
        'campaign_email_skipped',
        'Mail pominięty',
        format('%s został pominięty w kampanii "%s".', v_label, v_campaign.name),
        'info',
        'campaign',
        v_campaign.id,
        '/app/campaigns',
        jsonb_build_object('campaign_id', v_campaign.id, 'email_id', new.id, 'lead_id', new.lead_id),
        'campaign_email_skipped:' || new.id::text
      );
    end if;
  elsif new.status = 'bounced' then
    perform public.zec_insert_notification(
      v_campaign.user_id,
      'campaign_email_bounced',
      'Mail odbity',
      format('%s w kampanii "%s". %s', v_label, v_campaign.name, coalesce(nullif(new.bounce_reason, ''), 'Serwer odbiorcy odrzucił wiadomość.')),
      'warning',
      'campaign',
      v_campaign.id,
      '/app/campaigns',
      jsonb_build_object('campaign_id', v_campaign.id, 'email_id', new.id, 'lead_id', new.lead_id, 'bounce_type', new.bounce_type, 'bounce_reason', new.bounce_reason),
      'campaign_email_bounced:' || new.id::text
    );
  elsif new.status = 'replied' then
    perform public.zec_insert_notification(
      v_campaign.user_id,
      'new_reply',
      'Nowa odpowiedź',
      format('%s odpowiedział w kampanii "%s".', v_label, v_campaign.name),
      'success',
      'campaign',
      v_campaign.id,
      '/app/campaigns',
      jsonb_build_object('campaign_id', v_campaign.id, 'email_id', new.id, 'lead_id', new.lead_id, 'reply_subject', new.reply_subject, 'reply_snippet', new.reply_snippet),
      'new_reply:' || new.id::text
    );
  end if;

  return new;
end;
$$;

drop trigger if exists campaign_emails_notify_status_event on public.campaign_emails;
create trigger campaign_emails_notify_status_event
  after update of status on public.campaign_emails
  for each row
  execute function public.zec_notify_campaign_email_event();

create or replace function public.zec_notify_campaign_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stats record;
begin
  if new.status is distinct from 'completed' or old.status is not distinct from new.status then
    return new;
  end if;

  select
    count(*)::integer as total_count,
    count(*) filter (where status in ('sent', 'replied'))::integer as sent_count,
    count(*) filter (where status = 'replied')::integer as reply_count,
    count(*) filter (where status in ('failed', 'bounced'))::integer as issue_count
  into v_stats
  from public.campaign_emails
  where campaign_id = new.id;

  perform public.zec_insert_notification(
    new.user_id,
    'campaign_finished',
    'Wysyłka zakończona',
    format('Kampania "%s": %s/%s maili wysłanych, %s odpowiedzi, %s problemów.', new.name, coalesce(v_stats.sent_count, 0), coalesce(v_stats.total_count, 0), coalesce(v_stats.reply_count, 0), coalesce(v_stats.issue_count, 0)),
    case when coalesce(v_stats.issue_count, 0) > 0 then 'warning' else 'success' end,
    'campaign',
    new.id,
    '/app/campaigns',
    jsonb_build_object('campaign_id', new.id, 'sent_count', coalesce(v_stats.sent_count, 0), 'total_count', coalesce(v_stats.total_count, 0), 'reply_count', coalesce(v_stats.reply_count, 0), 'issue_count', coalesce(v_stats.issue_count, 0)),
    'campaign_finished:' || new.id::text
  );

  return new;
end;
$$;

drop trigger if exists campaigns_notify_completed on public.campaigns;
create trigger campaigns_notify_completed
  after update of status on public.campaigns
  for each row
  execute function public.zec_notify_campaign_completed();

create or replace function public.zec_notify_mailbox_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'error' and old.status is distinct from new.status then
    perform public.zec_insert_notification(
      new.user_id,
      'mailbox_error',
      'Problem ze skrzynką',
      format('Skrzynka %s wymaga sprawdzenia połączenia SMTP/IMAP.', new.email_address),
      'error',
      'mailbox',
      new.id,
      '/app/settings',
      jsonb_build_object('email_account_id', new.id, 'email_address', new.email_address),
      'mailbox_error:' || new.id::text || ':' || to_char(now(), 'YYYY-MM-DD')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists email_accounts_notify_status_event on public.email_accounts;
create trigger email_accounts_notify_status_event
  after update of status on public.email_accounts
  for each row
  execute function public.zec_notify_mailbox_status_event();
