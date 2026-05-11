create or replace function public.zec_normalize_search_text(p_value text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $$
  select trim(regexp_replace(
    regexp_replace(
      translate(lower(coalesce(p_value, '')), 'ąćęłńóśźż', 'acelnoszz'),
      '[^a-z0-9]+',
      ' ',
      'g'
    ),
    '\s+',
    ' ',
    'g'
  ));
$$;

drop function if exists public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean);
drop function if exists public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean, text);

create or replace function public.zec_search_global_leads(
  p_city text default null,
  p_industry_tokens text[] default '{}',
  p_keyword_tokens text[] default '{}',
  p_max_leads integer default 10,
  p_search_depth text default 'basic',
  p_require_email boolean default true,
  p_require_website boolean default false,
  p_require_social boolean default false,
  p_only_enriched boolean default false,
  p_country text default null
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
  v_country text := nullif(public.zec_normalize_search_text(coalesce(p_country, '')), '');
  v_all_tokens text[] := coalesce(p_industry_tokens, '{}'::text[]) || coalesce(p_keyword_tokens, '{}'::text[]);
  v_credits_after integer := 0;
  v_total_matches integer := 0;
  v_query_hash text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if v_country = 'global' then
    v_country := null;
  end if;

  select coalesce(profile_row.credits, 0)
  into v_credits_after
  from public.profiles profile_row
  where profile_row.id = v_user_id;

  v_query_hash := md5(
    concat_ws(
      '|',
      coalesce(p_country, ''),
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
        or jsonb_array_length(coalesce(prepared_row.business_signals, '[]'::jsonb)) > 0
        or jsonb_array_length(coalesce(prepared_row.data_sources, '[]'::jsonb)) > 0
        or prepared_row.instagram_last_post is not null
        or prepared_row.linkedin_bio is not null
        or prepared_row.instagram_url is not null
        or prepared_row.linkedin_url is not null
        or prepared_row.facebook_url is not null
        or prepared_row.phone is not null
        or prepared_row.address is not null
        or prepared_row.contact_page_url is not null
      )
      and (
        v_country is null
        or public.zec_normalize_search_text(coalesce(prepared_row.country, '')) = v_country
        or public.zec_normalize_search_text(coalesce(prepared_row.country, '')) like '%' || v_country || '%'
      )
      and (
        v_city is null
        or public.zec_normalize_search_text(coalesce(prepared_row.city, '')) = v_city
        or public.zec_normalize_search_text(coalesce(prepared_row.city, '')) like '%' || v_city || '%'
        or public.zec_normalize_search_text(coalesce(prepared_row.region, '')) like '%' || v_city || '%'
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
          when v_city is not null and public.zec_normalize_search_text(coalesce(prepared_row.city, '')) = v_city then 32
          when v_city is not null and public.zec_normalize_search_text(coalesce(prepared_row.city, '')) like '%' || v_city || '%' then 24
          when v_city is not null and public.zec_normalize_search_text(coalesce(prepared_row.region, '')) like '%' || v_city || '%' then 10
          else 0
        end
        +
        case
          when v_country is not null and public.zec_normalize_search_text(coalesce(prepared_row.country, '')) = v_country then 6
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
        case
          when jsonb_array_length(coalesce(prepared_row.business_signals, '[]'::jsonb)) > 0
            or jsonb_array_length(coalesce(prepared_row.data_sources, '[]'::jsonb)) > 0
          then 12
          when prepared_row.enrichment_status = 'enriched' then 4
          else 0
        end
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
        or jsonb_array_length(coalesce(prepared_row.business_signals, '[]'::jsonb)) > 0
        or jsonb_array_length(coalesce(prepared_row.data_sources, '[]'::jsonb)) > 0
        or prepared_row.instagram_last_post is not null
        or prepared_row.linkedin_bio is not null
        or prepared_row.instagram_url is not null
        or prepared_row.linkedin_url is not null
        or prepared_row.facebook_url is not null
        or prepared_row.phone is not null
        or prepared_row.address is not null
        or prepared_row.contact_page_url is not null
      )
      and (
        v_country is null
        or public.zec_normalize_search_text(coalesce(prepared_row.country, '')) = v_country
        or public.zec_normalize_search_text(coalesce(prepared_row.country, '')) like '%' || v_country || '%'
      )
      and (
        v_city is null
        or public.zec_normalize_search_text(coalesce(prepared_row.city, '')) = v_city
        or public.zec_normalize_search_text(coalesce(prepared_row.city, '')) like '%' || v_city || '%'
        or public.zec_normalize_search_text(coalesce(prepared_row.region, '')) like '%' || v_city || '%'
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

revoke execute on function public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean, text) from anon;
grant execute on function public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean, text) to authenticated;
