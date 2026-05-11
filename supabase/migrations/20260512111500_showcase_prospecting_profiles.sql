with showcase(company_name, showcase_category) as (
  values
    ('PF-PROJEKT Sp. z o.o.', 'architecture'),
    ('Juka Pracownia Projektowa', 'architecture'),
    ('Biuro projektowe MYK Projektanci', 'architecture'),
    ('WE’RE ARCHITECTS', 'architecture'),
    ('Ronson Development', 'architecture'),
    ('Netguru', 'software'),
    ('Monterail', 'software'),
    ('STX Next', 'software'),
    ('10Clouds', 'software'),
    ('Merixstudio', 'software'),
    ('DevaGroup', 'marketing'),
    ('More Bananas', 'marketing'),
    ('Tigers', 'marketing'),
    ('Delante', 'marketing'),
    ('Harbingers', 'marketing'),
    ('Dr Szczyt Chirurgia Plastyczna', 'medical_beauty'),
    ('Klinika La Perla - Warszawa Klif', 'medical_beauty'),
    ('Klinika La Perla - Warszawa Lowicka', 'medical_beauty'),
    ('Klinika La Perla - Krakow', 'medical_beauty'),
    ('Klinika Ambroziak', 'medical_beauty'),
    ('Raffles Europejski Warsaw', 'hospitality'),
    ('Flaner Hotel Warszawa', 'hospitality'),
    ('Hotel Boss Warszawa', 'hospitality'),
    ('Nobu Hotel Warsaw', 'hospitality'),
    ('Hamilton May', 'real_estate'),
    ('Lions Estate', 'real_estate'),
    ('Partners International', 'real_estate'),
    ('MODIVO', 'ecommerce'),
    ('Coffeedesk', 'ecommerce'),
    ('GymBeam', 'ecommerce')
)
update public.global_leads lead_row
set
  public_profile = coalesce(lead_row.public_profile, '{}'::jsonb) || jsonb_build_object(
    'showcase_full_profile', true,
    'showcase_category', showcase.showcase_category,
    'showcase_label', 'Darmowy pełny profil'
  ),
  business_signals = case
    when jsonb_array_length(coalesce(lead_row.business_signals, '[]'::jsonb)) > 0 then lead_row.business_signals
    else jsonb_build_array(
      jsonb_build_object(
        'label', 'Profil publiczny',
        'value', coalesce(nullif(lead_row.description, ''), concat_ws(' · ', lead_row.industry, lead_row.city))
      ),
      jsonb_build_object(
        'label', 'Social media',
        'value', case
          when lead_row.instagram_url is not null or lead_row.linkedin_url is not null or lead_row.facebook_url is not null
            then 'Potwierdzone publiczne profile social media w rekordzie.'
          else 'Brak potwierdzonych profili social media w obecnym rekordzie.'
        end
      )
    )
  end,
  data_sources = case
    when jsonb_array_length(coalesce(lead_row.data_sources, '[]'::jsonb)) > 0 then lead_row.data_sources
    else (
      select coalesce(
        jsonb_agg(jsonb_build_object('type', source_type, 'label', source_label, 'url', source_url)),
        '[]'::jsonb
      )
      from (
        values
          ('website', lead_row.website, 'Strona firmowa'),
          ('contact_page', lead_row.contact_page_url, 'Kontakt'),
          ('instagram', lead_row.instagram_url, 'Instagram'),
          ('linkedin', lead_row.linkedin_url, 'LinkedIn'),
          ('facebook', lead_row.facebook_url, 'Facebook')
      ) as source_rows(source_type, source_url, source_label)
      where source_url is not null
    )
  end,
  contact_status = case when lead_row.email is not null then 'found' else lead_row.contact_status end,
  data_quality_score = greatest(coalesce(lead_row.data_quality_score, 0), case
    when lead_row.instagram_url is not null and lead_row.linkedin_url is not null and lead_row.facebook_url is not null then 95
    else 88
  end),
  source_confidence = greatest(coalesce(lead_row.source_confidence, 0), case
    when lead_row.instagram_url is not null and lead_row.linkedin_url is not null and lead_row.facebook_url is not null then 92
    else 86
  end),
  last_checked_at = now()
from showcase
where lead_row.company_name = showcase.company_name;

create or replace function public.zec_preview_global_leads(p_limit integer default 10)
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
begin
  return query
  select
    lead_row.id,
    lead_row.query_hash,
    lead_row.company_name,
    case
      when coalesce((lead_row.public_profile->>'showcase_full_profile')::boolean, false)
        or unlocked_row.global_lead_id is not null
        or saved_row.id is not null
      then lead_row.email
      else null::text
    end as email,
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
    (
      coalesce((lead_row.public_profile->>'showcase_full_profile')::boolean, false)
      or unlocked_row.global_lead_id is not null
      or saved_row.id is not null
    ) as is_unlocked,
    coalesce(
      unlocked_row.unlock_depth,
      case
        when coalesce((lead_row.public_profile->>'showcase_full_profile')::boolean, false) then 'enriched'
        when saved_row.id is not null then 'basic'
        else null
      end
    ) as unlock_depth,
    (lead_row.email is not null) as email_available
  from public.global_leads lead_row
  left join public.user_unlocked_global_leads unlocked_row
    on unlocked_row.global_lead_id = lead_row.id
   and unlocked_row.user_id = v_user_id
  left join public.user_leads saved_row
    on saved_row.global_lead_id = lead_row.id
   and saved_row.user_id = v_user_id
  where lead_row.company_name is not null
  order by
    coalesce((lead_row.public_profile->>'showcase_full_profile')::boolean, false) desc,
    coalesce(lead_row.data_quality_score, 0) desc,
    coalesce(lead_row.source_confidence, 0) desc,
    (lead_row.email is not null) desc,
    lead_row.created_at desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
end;
$$;

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
      coalesce((lead_row.public_profile->>'showcase_full_profile')::boolean, false) as is_showcase,
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
      coalesce((lead_row.public_profile->>'showcase_full_profile')::boolean, false) as is_showcase,
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
      filtered_row.is_showcase desc,
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
    case when ranked_row.is_unlocked or ranked_row.is_showcase then ranked_row.email else null::text end as email,
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
    (ranked_row.is_unlocked or ranked_row.is_showcase) as is_unlocked,
    coalesce(ranked_row.unlock_depth, case when ranked_row.is_showcase then 'enriched' else null end) as unlock_depth,
    (ranked_row.email is not null) as email_available
  from ranked ranked_row;
end;
$$;

revoke execute on function public.zec_preview_global_leads(integer) from anon;
revoke execute on function public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean, text) from public;
revoke execute on function public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean, text) from anon;
grant execute on function public.zec_preview_global_leads(integer) to authenticated;
grant execute on function public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean, text) to authenticated;
