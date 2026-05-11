create or replace function public.zec_search_global_leads(
  p_city text default null,
  p_industry_tokens text[] default '{}',
  p_keyword_tokens text[] default '{}',
  p_max_leads integer default 10,
  p_search_depth text default 'basic',
  p_require_email boolean default true,
  p_require_website boolean default false,
  p_require_social boolean default false,
  p_only_enriched boolean default false
)
returns table (
  id uuid,
  query_hash text,
  company_name text,
  email text,
  website text,
  city text,
  industry text,
  instagram_url text,
  linkedin_url text,
  facebook_url text,
  linkedin_bio text,
  instagram_last_post text,
  ai_icebreaker text,
  email_source text,
  enrichment_status text,
  enriched_at timestamptz,
  created_at timestamptz,
  credits_after integer,
  charged_credits integer,
  total_matches integer,
  country text,
  region text,
  address text,
  phone text,
  contact_page_url text,
  description text,
  category_tags text[],
  technologies text[],
  business_signals jsonb,
  data_sources jsonb,
  contact_status text,
  data_quality_score integer,
  source_confidence integer,
  last_checked_at timestamptz,
  public_profile jsonb,
  is_unlocked boolean,
  unlock_depth text,
  email_available boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_max_leads, 10), 1), 50);
  v_city text := nullif(public.zec_normalize_search_text(coalesce(p_city, '')), '');
  v_all_tokens text[] := coalesce(p_industry_tokens, '{}'::text[]) || coalesce(p_keyword_tokens, '{}'::text[]);
  v_credits_after integer := 0;
  v_total_matches integer := 0;
  v_query_hash text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select coalesce(profile_row.credits, 0)
  into v_credits_after
  from public.profiles profile_row
  where profile_row.id = v_user_id;

  v_query_hash := md5(
    concat_ws(
      '|',
      coalesce(p_city, ''),
      array_to_string(coalesce(p_industry_tokens, '{}'::text[]), ','),
      array_to_string(coalesce(p_keyword_tokens, '{}'::text[]), ','),
      coalesce(p_search_depth, 'basic'),
      coalesce(p_require_email, true)::text,
      coalesce(p_require_website, false)::text,
      coalesce(p_require_social, false)::text,
      coalesce(p_only_enriched, false)::text
    )
  );

  with prepared as (
    select
      lead_row.*,
      public.zec_global_lead_search_text(lead_row) as haystack,
      (unlocked_row.global_lead_id is not null or saved_row.id is not null) as is_unlocked,
      coalesce(unlocked_row.unlock_depth, case when saved_row.id is not null then 'basic' else null end) as unlock_depth
    from public.global_leads lead_row
    left join public.user_unlocked_global_leads unlocked_row
      on unlocked_row.global_lead_id = lead_row.id
     and unlocked_row.user_id = v_user_id
    left join public.user_leads saved_row
      on saved_row.global_lead_id = lead_row.id
     and saved_row.user_id = v_user_id
  ),
  filtered as (
    select prepared_row.*
    from prepared prepared_row
    where (not coalesce(p_require_email, true) or prepared_row.email is not null)
      and (not coalesce(p_require_website, false) or prepared_row.website is not null)
      and (
        not coalesce(p_require_social, false)
        or prepared_row.instagram_url is not null
        or prepared_row.linkedin_url is not null
        or prepared_row.facebook_url is not null
      )
      and (
        not coalesce(p_only_enriched, false)
        or prepared_row.enrichment_status = 'enriched'
        or prepared_row.data_quality_score >= 70
        or jsonb_array_length(coalesce(prepared_row.business_signals, '[]'::jsonb)) > 0
      )
      and (
        v_city is null
        or public.zec_normalize_search_text(coalesce(prepared_row.city, '')) like '%' || v_city || '%'
        or public.zec_normalize_search_text(coalesce(prepared_row.country, '')) like '%' || v_city || '%'
      )
      and (
        cardinality(v_all_tokens) = 0
        or exists (
          select 1
          from unnest(v_all_tokens) as token(value)
          where prepared_row.haystack like '%' || public.zec_normalize_search_text(token.value) || '%'
        )
      )
  )
  select count(*)::integer
  into v_total_matches
  from filtered;

  insert into public.search_requests (user_id, query_hash, status, leads_requested, leads_found)
  values (v_user_id, v_query_hash, 'completed', v_limit, v_total_matches);

  return query
  with prepared as (
    select
      lead_row.*,
      public.zec_global_lead_search_text(lead_row) as haystack,
      (unlocked_row.global_lead_id is not null or saved_row.id is not null) as is_unlocked,
      coalesce(unlocked_row.unlock_depth, case when saved_row.id is not null then 'basic' else null end) as unlock_depth
    from public.global_leads lead_row
    left join public.user_unlocked_global_leads unlocked_row
      on unlocked_row.global_lead_id = lead_row.id
     and unlocked_row.user_id = v_user_id
    left join public.user_leads saved_row
      on saved_row.global_lead_id = lead_row.id
     and saved_row.user_id = v_user_id
  ),
  filtered as (
    select
      prepared_row.*,
      (
        case
          when v_city is not null and public.zec_normalize_search_text(coalesce(prepared_row.city, '')) like '%' || v_city || '%' then 28
          when v_city is not null and public.zec_normalize_search_text(coalesce(prepared_row.country, '')) like '%' || v_city || '%' then 10
          else 0
        end
        +
        coalesce((
          select sum(case when prepared_row.haystack like '%' || public.zec_normalize_search_text(token.value) || '%' then 12 else 0 end)
          from unnest(v_all_tokens) as token(value)
        ), 0)
        +
        case when prepared_row.email is not null then 10 else 0 end
        +
        case when prepared_row.website is not null then 6 else 0 end
        +
        least(coalesce(prepared_row.data_quality_score, 0), 100) / 5
        +
        case when prepared_row.enrichment_status = 'enriched' then 8 else 0 end
        +
        case
          when prepared_row.instagram_url is not null
            or prepared_row.linkedin_url is not null
            or prepared_row.facebook_url is not null
          then 5
          else 0
        end
      ) as match_score
    from prepared prepared_row
    where (not coalesce(p_require_email, true) or prepared_row.email is not null)
      and (not coalesce(p_require_website, false) or prepared_row.website is not null)
      and (
        not coalesce(p_require_social, false)
        or prepared_row.instagram_url is not null
        or prepared_row.linkedin_url is not null
        or prepared_row.facebook_url is not null
      )
      and (
        not coalesce(p_only_enriched, false)
        or prepared_row.enrichment_status = 'enriched'
        or prepared_row.data_quality_score >= 70
        or jsonb_array_length(coalesce(prepared_row.business_signals, '[]'::jsonb)) > 0
      )
      and (
        v_city is null
        or public.zec_normalize_search_text(coalesce(prepared_row.city, '')) like '%' || v_city || '%'
        or public.zec_normalize_search_text(coalesce(prepared_row.country, '')) like '%' || v_city || '%'
      )
      and (
        cardinality(v_all_tokens) = 0
        or exists (
          select 1
          from unnest(v_all_tokens) as token(value)
          where prepared_row.haystack like '%' || public.zec_normalize_search_text(token.value) || '%'
        )
      )
  ),
  ranked as (
    select filtered_row.*
    from filtered filtered_row
    order by
      filtered_row.match_score desc,
      coalesce(filtered_row.data_quality_score, 0) desc,
      coalesce(filtered_row.source_confidence, 0) desc,
      (filtered_row.email is not null) desc,
      filtered_row.created_at desc
    limit v_limit
  )
  select
    ranked_row.id,
    ranked_row.query_hash,
    ranked_row.company_name,
    case when ranked_row.is_unlocked then ranked_row.email else null::text end as email,
    ranked_row.website,
    ranked_row.city,
    ranked_row.industry,
    ranked_row.instagram_url,
    ranked_row.linkedin_url,
    ranked_row.facebook_url,
    ranked_row.linkedin_bio,
    ranked_row.instagram_last_post,
    null::text as ai_icebreaker,
    ranked_row.email_source,
    ranked_row.enrichment_status,
    ranked_row.enriched_at,
    ranked_row.created_at,
    v_credits_after as credits_after,
    0 as charged_credits,
    v_total_matches as total_matches,
    ranked_row.country,
    ranked_row.region,
    ranked_row.address,
    ranked_row.phone,
    ranked_row.contact_page_url,
    ranked_row.description,
    ranked_row.category_tags,
    ranked_row.technologies,
    ranked_row.business_signals,
    ranked_row.data_sources,
    ranked_row.contact_status,
    ranked_row.data_quality_score,
    ranked_row.source_confidence,
    ranked_row.last_checked_at,
    ranked_row.public_profile,
    ranked_row.is_unlocked,
    ranked_row.unlock_depth,
    (ranked_row.email is not null) as email_available
  from ranked ranked_row;
end;
$$;

create or replace function public.zec_unlock_global_leads(
  p_lead_ids uuid[],
  p_unlock_depth text default 'basic'
)
returns table (
  id uuid,
  query_hash text,
  company_name text,
  email text,
  website text,
  city text,
  industry text,
  instagram_url text,
  linkedin_url text,
  facebook_url text,
  linkedin_bio text,
  instagram_last_post text,
  ai_icebreaker text,
  email_source text,
  enrichment_status text,
  enriched_at timestamptz,
  created_at timestamptz,
  credits_after integer,
  charged_credits integer,
  total_matches integer,
  country text,
  region text,
  address text,
  phone text,
  contact_page_url text,
  description text,
  category_tags text[],
  technologies text[],
  business_signals jsonb,
  data_sources jsonb,
  contact_status text,
  data_quality_score integer,
  source_confidence integer,
  last_checked_at timestamptz,
  public_profile jsonb,
  is_unlocked boolean,
  unlock_depth text,
  email_available boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_requested_depth text := case when lower(coalesce(p_unlock_depth, 'basic')) = 'enriched' then 'enriched' else 'basic' end;
  v_requested_rank integer := case when lower(coalesce(p_unlock_depth, 'basic')) = 'enriched' then 2 else 1 end;
  v_charge integer := 0;
  v_balance integer := 0;
  v_balance_after integer := 0;
  v_unlockable_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_lead_ids is null or cardinality(p_lead_ids) = 0 then
    return;
  end if;

  select coalesce(profile_row.credits, 0)
  into v_balance
  from public.profiles profile_row
  where profile_row.id = v_user_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  with requested as (
    select distinct request_item.lead_id
    from unnest(p_lead_ids) as request_item(lead_id)
  ),
  targets as (
    select
      lead_row.id as global_lead_id,
      greatest(
        case unlocked_row.unlock_depth when 'enriched' then 2 when 'basic' then 1 else 0 end,
        case when saved_row.id is not null then v_requested_rank else 0 end
      ) as existing_rank
    from requested requested_row
    join public.global_leads lead_row on lead_row.id = requested_row.lead_id
    left join public.user_unlocked_global_leads unlocked_row
      on unlocked_row.global_lead_id = lead_row.id
     and unlocked_row.user_id = v_user_id
    left join public.user_leads saved_row
      on saved_row.global_lead_id = lead_row.id
     and saved_row.user_id = v_user_id
    where lead_row.email is not null
  ),
  priced as (
    select
      targets.global_lead_id,
      case
        when targets.existing_rank >= v_requested_rank then 0
        when v_requested_depth = 'basic' then 1
        when targets.existing_rank = 1 then 2
        else 3
      end as cost
    from targets
  )
  select coalesce(sum(priced.cost), 0)::integer, count(*)::integer
  into v_charge, v_unlockable_count
  from priced;

  if v_unlockable_count = 0 then
    raise exception 'No unlockable leads with email found';
  end if;

  if v_charge > v_balance then
    raise exception 'Insufficient credits';
  end if;

  if v_charge > 0 then
    update public.profiles profile_row
    set credits = coalesce(profile_row.credits, 0) - v_charge
    where profile_row.id = v_user_id
    returning coalesce(profile_row.credits, 0)
    into v_balance_after;

    insert into public.credit_transactions (user_id, amount, balance_after, reason, metadata)
    values (
      v_user_id,
      -v_charge,
      v_balance_after,
      'lead_unlock',
      jsonb_build_object(
        'lead_ids', p_lead_ids,
        'unlock_depth', v_requested_depth,
        'lead_count', v_unlockable_count
      )
    );
  else
    v_balance_after := v_balance;
  end if;

  with requested as (
    select distinct request_item.lead_id
    from unnest(p_lead_ids) as request_item(lead_id)
  ),
  targets as (
    select
      lead_row.id as global_lead_id,
      greatest(
        case unlocked_row.unlock_depth when 'enriched' then 2 when 'basic' then 1 else 0 end,
        case when saved_row.id is not null then v_requested_rank else 0 end
      ) as existing_rank
    from requested requested_row
    join public.global_leads lead_row on lead_row.id = requested_row.lead_id
    left join public.user_unlocked_global_leads unlocked_row
      on unlocked_row.global_lead_id = lead_row.id
     and unlocked_row.user_id = v_user_id
    left join public.user_leads saved_row
      on saved_row.global_lead_id = lead_row.id
     and saved_row.user_id = v_user_id
    where lead_row.email is not null
  ),
  priced as (
    select
      targets.global_lead_id,
      case
        when targets.existing_rank >= v_requested_rank then 0
        when v_requested_depth = 'basic' then 1
        when targets.existing_rank = 1 then 2
        else 3
      end as cost
    from targets
  )
  insert into public.user_unlocked_global_leads (user_id, global_lead_id, unlock_depth, credits_spent)
  select v_user_id, priced.global_lead_id, v_requested_depth, priced.cost
  from priced
  on conflict (user_id, global_lead_id) do update
  set
    unlock_depth = case
      when user_unlocked_global_leads.unlock_depth = 'enriched'
        or excluded.unlock_depth = 'enriched'
      then 'enriched'
      else 'basic'
    end,
    credits_spent = user_unlocked_global_leads.credits_spent + excluded.credits_spent,
    updated_at = now();

  return query
  select
    lead_row.id,
    lead_row.query_hash,
    lead_row.company_name,
    lead_row.email,
    lead_row.website,
    lead_row.city,
    lead_row.industry,
    lead_row.instagram_url,
    lead_row.linkedin_url,
    lead_row.facebook_url,
    lead_row.linkedin_bio,
    lead_row.instagram_last_post,
    null::text as ai_icebreaker,
    lead_row.email_source,
    lead_row.enrichment_status,
    lead_row.enriched_at,
    lead_row.created_at,
    v_balance_after as credits_after,
    v_charge as charged_credits,
    v_unlockable_count as total_matches,
    lead_row.country,
    lead_row.region,
    lead_row.address,
    lead_row.phone,
    lead_row.contact_page_url,
    lead_row.description,
    lead_row.category_tags,
    lead_row.technologies,
    lead_row.business_signals,
    lead_row.data_sources,
    lead_row.contact_status,
    lead_row.data_quality_score,
    lead_row.source_confidence,
    lead_row.last_checked_at,
    lead_row.public_profile,
    true as is_unlocked,
    unlocked_row.unlock_depth,
    (lead_row.email is not null) as email_available
  from public.global_leads lead_row
  join public.user_unlocked_global_leads unlocked_row
    on unlocked_row.global_lead_id = lead_row.id
   and unlocked_row.user_id = v_user_id
  where lead_row.id = any(p_lead_ids)
    and lead_row.email is not null
  order by lead_row.company_name;
end;
$$;

revoke execute on function public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean) from anon;
revoke execute on function public.zec_unlock_global_leads(uuid[], text) from anon;
grant execute on function public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean) to authenticated;
grant execute on function public.zec_unlock_global_leads(uuid[], text) to authenticated;
