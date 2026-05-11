alter table public.global_leads
  add column if not exists country text default 'Polska',
  add column if not exists region text,
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists contact_page_url text,
  add column if not exists description text,
  add column if not exists category_tags text[] not null default '{}',
  add column if not exists technologies text[] not null default '{}',
  add column if not exists business_signals jsonb not null default '[]'::jsonb,
  add column if not exists data_sources jsonb not null default '[]'::jsonb,
  add column if not exists contact_status text not null default 'unknown',
  add column if not exists data_quality_score integer not null default 0,
  add column if not exists source_confidence integer not null default 0,
  add column if not exists last_checked_at timestamptz,
  add column if not exists public_profile jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'global_leads_contact_status_check'
      and conrelid = 'public.global_leads'::regclass
  ) then
    alter table public.global_leads
      add constraint global_leads_contact_status_check
      check (contact_status in ('unknown', 'found', 'verified', 'risky', 'missing'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'global_leads_quality_score_check'
      and conrelid = 'public.global_leads'::regclass
  ) then
    alter table public.global_leads
      add constraint global_leads_quality_score_check
      check (data_quality_score >= 0 and data_quality_score <= 100);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'global_leads_source_confidence_check'
      and conrelid = 'public.global_leads'::regclass
  ) then
    alter table public.global_leads
      add constraint global_leads_source_confidence_check
      check (source_confidence >= 0 and source_confidence <= 100);
  end if;
end $$;

create index if not exists global_leads_category_tags_idx
  on public.global_leads using gin (category_tags);

create index if not exists global_leads_technologies_idx
  on public.global_leads using gin (technologies);

create index if not exists global_leads_public_profile_idx
  on public.global_leads using gin (public_profile);

create index if not exists global_leads_quality_idx
  on public.global_leads (data_quality_score desc, source_confidence desc);

create index if not exists global_leads_country_city_idx
  on public.global_leads (country, city);

create table if not exists public.user_unlocked_global_leads (
  user_id uuid not null references auth.users(id) on delete cascade,
  global_lead_id uuid not null references public.global_leads(id) on delete cascade,
  unlock_depth text not null default 'basic' check (unlock_depth in ('basic', 'enriched')),
  credits_spent integer not null default 0 check (credits_spent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, global_lead_id)
);

alter table public.user_unlocked_global_leads enable row level security;

create index if not exists user_unlocked_global_leads_global_lead_id_idx
  on public.user_unlocked_global_leads (global_lead_id);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_unlocked_global_leads'
      and policyname = 'Users can read own unlocked global leads'
  ) then
    create policy "Users can read own unlocked global leads"
      on public.user_unlocked_global_leads
      for select
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_unlocked_global_leads'
      and policyname = 'Users can insert own unlocked global leads'
  ) then
    create policy "Users can insert own unlocked global leads"
      on public.user_unlocked_global_leads
      for insert
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_unlocked_global_leads'
      and policyname = 'Users can update own unlocked global leads'
  ) then
    create policy "Users can update own unlocked global leads"
      on public.user_unlocked_global_leads
      for update
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'global_leads'
      and policyname = 'Users can read unlocked global leads'
  ) then
    create policy "Users can read unlocked global leads"
      on public.global_leads
      for select
      using (
        exists (
          select 1
          from public.user_unlocked_global_leads ugl
          where ugl.global_lead_id = global_leads.id
            and ugl.user_id = (select auth.uid())
        )
      );
  end if;
end $$;

drop policy if exists "Users can read saved global leads" on public.global_leads;
drop policy if exists "Users can read unlocked global leads" on public.global_leads;
drop policy if exists "Users can read saved or unlocked global leads" on public.global_leads;

create policy "Users can read saved or unlocked global leads"
  on public.global_leads
  for select
  using (
    exists (
      select 1
      from public.user_leads ul
      where ul.global_lead_id = global_leads.id
        and ul.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.user_unlocked_global_leads ugl
      where ugl.global_lead_id = global_leads.id
        and ugl.user_id = (select auth.uid())
    )
  );

create or replace function public.zec_global_lead_search_text(p_lead public.global_leads)
returns text
language sql
stable
set search_path = public
as $$
  select public.zec_normalize_search_text(
    concat_ws(
      ' ',
      p_lead.company_name,
      p_lead.email,
      p_lead.website,
      p_lead.city,
      p_lead.country,
      p_lead.region,
      p_lead.industry,
      p_lead.description,
      p_lead.linkedin_bio,
      p_lead.instagram_last_post,
      p_lead.ai_icebreaker,
      array_to_string(p_lead.category_tags, ' '),
      array_to_string(p_lead.technologies, ' '),
      p_lead.business_signals::text,
      p_lead.public_profile::text
    )
  );
$$;

update public.global_leads
set
  country = coalesce(country, 'Polska'),
  contact_status = case
    when email is not null then 'found'
    when contact_page_url is not null then 'unknown'
    else contact_status
  end,
  data_quality_score = greatest(
    data_quality_score,
    least(
      100,
      (case when email is not null then 25 else 0 end) +
      (case when website is not null then 15 else 0 end) +
      (case when city is not null then 10 else 0 end) +
      (case when industry is not null then 10 else 0 end) +
      (case when instagram_url is not null then 8 else 0 end) +
      (case when linkedin_url is not null then 8 else 0 end) +
      (case when linkedin_bio is not null then 10 else 0 end) +
      (case when instagram_last_post is not null then 8 else 0 end) +
      (case when ai_icebreaker is not null then 6 else 0 end)
    )
  ),
  source_confidence = greatest(
    source_confidence,
    case
      when email_source is not null or website is not null then 70
      when email is not null then 55
      else 35
    end
  ),
  last_checked_at = coalesce(last_checked_at, now())
where data_quality_score = 0
   or source_confidence = 0
   or country is null
   or last_checked_at is null;

insert into public.global_leads (
  query_hash,
  company_name,
  email,
  website,
  city,
  country,
  industry,
  instagram_url,
  linkedin_url,
  facebook_url,
  linkedin_bio,
  instagram_last_post,
  ai_icebreaker,
  email_source,
  enrichment_status,
  enriched_at,
  address,
  phone,
  contact_page_url,
  description,
  category_tags,
  technologies,
  business_signals,
  data_sources,
  contact_status,
  data_quality_score,
  source_confidence,
  last_checked_at,
  public_profile
) values
  (
    'seed:software:netguru',
    'Netguru',
    'hello@netguru.com',
    'https://www.netguru.com/',
    'Poznan',
    'Polska',
    'IT / Software house',
    null,
    'https://www.linkedin.com/company/netguru/',
    null,
    'IT services and consulting company focused on digital commerce, marketplaces, AI-powered personalization, engineering, and product design.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Male Garbary 9, 61-756 Poznan',
    null,
    'https://www.netguru.com/join-netguru',
    'Software development and product partner for commerce, marketplaces, retail ecosystems and AI-enabled digital products.',
    array['software_house', 'digital_commerce', 'ai', 'marketplaces', 'product_design'],
    array['AI', 'React', 'Node.js', 'Product Design', 'Design Systems'],
    '[{"label":"Scale","value":"400+ people, 2500+ projects, 17+ years on market"},{"label":"Market","value":"B2B commerce, marketplaces, retail ecosystems, AI personalization"}]'::jsonb,
    '[{"type":"website","url":"https://www.netguru.com/","label":"Official website"},{"type":"contact","url":"https://www.netguru.com/join-netguru","label":"Official website footer/contact data"},{"type":"linkedin","url":"https://www.linkedin.com/company/netguru/","label":"LinkedIn company profile"}]'::jsonb,
    'found',
    92,
    90,
    now(),
    '{"employee_range":"201-500","hq":"Poznan","segment":"software_development"}'::jsonb
  ),
  (
    'seed:software:stx-next',
    'STX Next',
    'business@stxnext.com',
    'https://www.stxnext.com/',
    'Poznan',
    'Polska',
    'IT / Software house',
    null,
    null,
    null,
    'AI, data and cloud technology partner built on Python heritage, serving financial services, industrial, technology, e-commerce and logistics sectors.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Mostowa 38, 61-854 Poznan',
    null,
    'https://www.stxnext.com/about-us',
    'AI, data and cloud software partner with strong Python heritage and enterprise delivery positioning.',
    array['software_house', 'ai', 'data', 'cloud', 'python', 'enterprise'],
    array['Python', 'AI', 'Machine Learning', 'Data Engineering', 'Cloud', 'AWS'],
    '[{"label":"Positioning","value":"AI-first technology partner built on Python heritage"},{"label":"Industries","value":"Financial services, industrials, technology, e-commerce, logistics"}]'::jsonb,
    '[{"type":"website","url":"https://www.stxnext.com/","label":"Official website"},{"type":"contact","url":"https://www.stxnext.com/about-us","label":"Official about/contact data"}]'::jsonb,
    'found',
    88,
    88,
    now(),
    '{"employee_range":"300+","hq":"Poznan","segment":"software_development"}'::jsonb
  ),
  (
    'seed:software:10clouds',
    '10Clouds',
    'hello@10clouds.com',
    'https://10clouds.com/',
    'Warszawa',
    'Polska',
    'IT / Software house',
    null,
    null,
    null,
    'Software and AI operations partner focused on financial institutions and digital product delivery.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'Chmielna 73, 00-801 Warszawa',
    '+48 573 173 773',
    'https://10clouds.com/contact-us/',
    'Software partner for AI-powered operations and product delivery, especially around financial institutions.',
    array['software_house', 'fintech', 'ai', 'product_development'],
    array['AI', 'FinTech', 'Product Development', 'Web Apps'],
    '[{"label":"Response SLA","value":"Contact page promises response within 1 working day"},{"label":"Segment","value":"Financial institutions and AI-powered operations"}]'::jsonb,
    '[{"type":"website","url":"https://10clouds.com/contact-us/","label":"Official contact page"}]'::jsonb,
    'found',
    86,
    88,
    now(),
    '{"hq":"Warszawa","segment":"software_development"}'::jsonb
  ),
  (
    'seed:software:monterail',
    'Monterail',
    'hello@monterail.com',
    'https://www.monterail.com/',
    'Wroclaw',
    'Polska',
    'IT / Software house',
    null,
    null,
    null,
    'AI-native software development agency delivering web, mobile and product design across fintech, healthtech, HRTech, retail and proptech.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Olawska 27-29, 50-123 Wroclaw',
    '+48 533 600 136',
    'https://www.monterail.com/contact/',
    'AI-native product studio for web, mobile and product design with strong services and partnership positioning.',
    array['software_house', 'ai', 'product_design', 'fintech', 'healthtech', 'proptech'],
    array['Vue.js', 'Nuxt', 'Ruby on Rails', 'React Native', 'Flutter', 'Node.js'],
    '[{"label":"Scale","value":"900+ projects, 130+ team, 15+ years on market"},{"label":"Industries","value":"HealthTech, FinTech, HRTech, Retail, PropTech"}]'::jsonb,
    '[{"type":"website","url":"https://www.monterail.com/","label":"Official website"},{"type":"contact","url":"https://www.monterail.com/contact/","label":"Official contact page"},{"type":"about","url":"https://www.monterail.com/about","label":"Official about page"}]'::jsonb,
    'found',
    91,
    90,
    now(),
    '{"employee_range":"100+","hq":"Wroclaw","segment":"software_development"}'::jsonb
  ),
  (
    'seed:software:merixstudio',
    'Merixstudio',
    'm.bien@merixstudio.com',
    'https://www.merixstudio.com/',
    'Poznan',
    'Polska',
    'IT / Software house',
    null,
    null,
    null,
    'Product and software development studio for complex, durable products solving operational and product problems.',
    null,
    null,
    'official contact page',
    'enriched',
    now(),
    'ul. Malachowskiego 10, 61-129 Poznan',
    '+48 570 233 207',
    'https://www.merixstudio.com/contact',
    'Software studio with official business analyst contact and international delivery positioning.',
    array['software_house', 'product_development', 'web_apps', 'business_analysis'],
    array['Web Apps', 'Product Design', 'Business Analysis'],
    '[{"label":"Contact","value":"Named business analyst contact listed publicly on official contact page"},{"label":"Offices","value":"Poznan HQ with New York and Dubai presence"}]'::jsonb,
    '[{"type":"website","url":"https://www.merixstudio.com/contact","label":"Official contact page"},{"type":"about","url":"https://www.merixstudio.com/about","label":"Official about page"}]'::jsonb,
    'found',
    84,
    86,
    now(),
    '{"hq":"Poznan","segment":"software_development"}'::jsonb
  ),
  (
    'seed:software:softwaremill',
    'SoftwareMill',
    'hello@softwaremill.com',
    'https://softwaremill.com/',
    'Warszawa',
    'Polska',
    'IT / Software house',
    null,
    null,
    null,
    'Remote-first software development company focused on backend, frontend, cybersecurity, LLM solutions, cloud and DevOps.',
    null,
    null,
    'public company registry / official website',
    'enriched',
    now(),
    'ul. Na Uboczu 8/87, 02-791 Warszawa',
    null,
    'https://softwaremill.com/contact/',
    'Technology-centred software partner with strong backend, cloud, DevOps, cybersecurity and LLM services.',
    array['software_house', 'backend', 'llm', 'cloud', 'devops', 'cybersecurity'],
    array['Scala', 'Java', 'Python', 'TypeScript', 'Apache Kafka', 'Kubernetes', 'AWS', 'LLM'],
    '[{"label":"Model","value":"Remote-first since day one"},{"label":"Services","value":"Backend, frontend, cybersecurity, LLM solutions, cloud and DevOps"}]'::jsonb,
    '[{"type":"website","url":"https://softwaremill.com/","label":"Official website"},{"type":"contact","url":"https://softwaremill.com/contact/","label":"Official contact page"}]'::jsonb,
    'found',
    82,
    78,
    now(),
    '{"hq":"Warszawa","segment":"software_development"}'::jsonb
  ),
  (
    'seed:marketing:devagroup',
    'DevaGroup',
    'kontakt@devagroup.pl',
    'https://www.devagroup.pl/',
    'Krakow',
    'Polska',
    'Marketing / SEO / SEM',
    null,
    null,
    null,
    'SEO, SEM, Google Ads, social media, audits and trainings agency with long market history and clear contact channels.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Lokietka 8D/26, 30-010 Krakow',
    '800 880 991',
    'https://www.devagroup.pl/kontakt',
    'SEO and SEM agency with dedicated contact, marketing cooperation channel and strong public proof points.',
    array['marketing_agency', 'seo', 'sem', 'google_ads', 'social_media', 'ecommerce'],
    array['SEO', 'Google Ads', 'Meta Ads', 'Analytics', 'Allegro Ads'],
    '[{"label":"Response signal","value":"Official page states average response in working days: 2h"},{"label":"Maturity","value":"Long-running SEO/SEM agency with broad services and training offer"}]'::jsonb,
    '[{"type":"website","url":"https://www.devagroup.pl/","label":"Official website"},{"type":"contact","url":"https://www.devagroup.pl/kontakt","label":"Official contact page"}]'::jsonb,
    'found',
    90,
    92,
    now(),
    '{"hq":"Krakow","segment":"digital_marketing"}'::jsonb
  ),
  (
    'seed:marketing:semahead',
    'Semahead',
    'kontakt@semahead.pl',
    'https://semahead.agency/',
    'Krakow',
    'Polska',
    'Marketing / SEO / SEM',
    null,
    null,
    null,
    'Performance marketing 360 and SEO agency serving companies that want to build or grow online sales channels.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    null,
    '+48 881 262 630',
    'https://semahead.agency/en/',
    'Performance marketing 360 agency with SEO, paid media and online sales growth positioning.',
    array['marketing_agency', 'performance_marketing', 'seo', 'sem', 'ecommerce'],
    array['SEO', 'Performance Marketing', 'Google Ads', 'Analytics'],
    '[{"label":"Positioning","value":"Digital marketing 360 and SEO agency"},{"label":"Goal","value":"Growth of online sales channels"}]'::jsonb,
    '[{"type":"website","url":"https://semahead.agency/en/","label":"Official website"}]'::jsonb,
    'found',
    82,
    84,
    now(),
    '{"segment":"digital_marketing"}'::jsonb
  ),
  (
    'seed:marketing:tigers',
    'Tigers',
    'hello@tigers.pl',
    'https://www.tigers.pl/',
    'Warszawa',
    'Polska',
    'Marketing / SEO / SEM',
    null,
    null,
    null,
    'Digital marketing agency covering performance, social media content, digital PR, analytics, SEO, e-mail marketing, UI/UX and strategy.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'Q22, al. Jana Pawla II 22, 00-133 Warszawa',
    null,
    'https://www.tigers.pl/kontakt/kontakt',
    'Full-funnel digital agency with performance, social, PR, analytics, SEO and creative services.',
    array['marketing_agency', 'performance_marketing', 'social_media', 'seo', 'strategy'],
    array['Performance Marketing', 'Social Media', 'Digital PR', 'SEO', 'Analytics', 'UI/UX'],
    '[{"label":"Services","value":"Performance, social content, digital PR, analytics, SEO and strategy"},{"label":"Footprint","value":"Warszawa HQ and Krakow branch listed publicly"}]'::jsonb,
    '[{"type":"contact","url":"https://www.tigers.pl/kontakt/kontakt","label":"Official contact page"}]'::jsonb,
    'found',
    84,
    88,
    now(),
    '{"hq":"Warszawa","segment":"digital_marketing"}'::jsonb
  ),
  (
    'seed:marketing:more-bananas',
    'More Bananas',
    'halo@morebananas.pl',
    'https://morebananas.pl/',
    'Krakow',
    'Polska',
    'Marketing / Creative agency',
    null,
    null,
    null,
    'Creative marketing agency focused on B2B marketing, social media, strategy, employer branding, content and influencer marketing.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Wielicka 42 lok. B3, 30-552 Krakow',
    '+48 504 082 192',
    'https://morebananas.pl/',
    'Creative marketing agency with clearly listed offer channels and multiple public contact emails by intent.',
    array['marketing_agency', 'creative_agency', 'b2b_marketing', 'social_media', 'employer_branding'],
    array['Social Media', 'Content Marketing', 'Employer Branding', 'Influencer Marketing'],
    '[{"label":"Offer","value":"B2B marketing, social media, strategy, employer branding, content and influencer marketing"},{"label":"Contact routing","value":"Separate public emails for offers, shop, training and partnerships"}]'::jsonb,
    '[{"type":"website","url":"https://morebananas.pl/","label":"Official website"}]'::jsonb,
    'found',
    86,
    90,
    now(),
    '{"hq":"Krakow","segment":"creative_marketing"}'::jsonb
  ),
  (
    'seed:marketing:delante',
    'Delante',
    'hello@delante.com',
    'https://delante.com/',
    'Krakow',
    'Polska',
    'Marketing / SEO / SEM',
    null,
    null,
    null,
    'International SEO, SEM and AI search agency with offices in Poland, UK, Spain, Italy and USA.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'Kilinskiego 2, 30-308 Krakow',
    '+48 12 200 20 10',
    'https://delante.com/contact/',
    'SEO, SEM and AI search agency with international footprint and strong review proof points.',
    array['marketing_agency', 'seo', 'sem', 'ai_search', 'international'],
    array['SEO', 'SEM', 'AI Search', 'Technical SEO'],
    '[{"label":"Footprint","value":"Poland HQ with UK, USA, Spain and Italy office presence"},{"label":"Positioning","value":"International SEO, SEM and AI search agency"}]'::jsonb,
    '[{"type":"contact","url":"https://delante.com/contact/","label":"Official contact page"},{"type":"website","url":"https://delante.pl/","label":"Official Polish website"}]'::jsonb,
    'found',
    84,
    86,
    now(),
    '{"hq":"Krakow","segment":"digital_marketing"}'::jsonb
  ),
  (
    'seed:marketing:harbingers',
    'Harbingers',
    'hello@harbingers.io',
    'https://harbingers.io/',
    'Krakow',
    'Polska',
    'Marketing / Growth agency',
    null,
    null,
    null,
    'Growth-focused agency with SEO, performance and e-commerce growth positioning.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'Mosieznicza 3, 31-547 Krakow',
    '+48 575 088 375',
    'https://harbingers.io/kontakt',
    'Growth agency with direct public contact and clear business-growth positioning.',
    array['marketing_agency', 'growth', 'seo', 'performance_marketing', 'ecommerce'],
    array['SEO', 'Performance Marketing', 'E-commerce Growth'],
    '[{"label":"Positioning","value":"Growth-focused digital agency"},{"label":"Contact","value":"Direct phone and email listed on official contact page"}]'::jsonb,
    '[{"type":"contact","url":"https://harbingers.io/kontakt","label":"Official contact page"}]'::jsonb,
    'found',
    82,
    88,
    now(),
    '{"hq":"Krakow","segment":"growth_marketing"}'::jsonb
  ),
  (
    'seed:marketing:seoski',
    'SEOSki',
    'kontakt@seoski.pl',
    'https://seoski.pl/',
    null,
    'Polska',
    'Marketing / SEO / SEM',
    null,
    null,
    null,
    'SEO and online business agency offering SEO, SEM, copywriting, web shops, sponsored articles and linkbuilding.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    null,
    '+48 605 377 393',
    'https://seoski.pl/en/',
    'SEO agency with public email, phone and broad SEO/SEM service set.',
    array['marketing_agency', 'seo', 'sem', 'copywriting', 'linkbuilding'],
    array['SEO', 'SEM', 'SEO Copywriting', 'Linkbuilding'],
    '[{"label":"Services","value":"SEO, SEM, SEO copywriting, sponsored articles and linkbuilding"},{"label":"Contact","value":"Public phone and email listed on official page"}]'::jsonb,
    '[{"type":"website","url":"https://seoski.pl/en/","label":"Official website"}]'::jsonb,
    'found',
    76,
    78,
    now(),
    '{"segment":"digital_marketing"}'::jsonb
  ),
  (
    'seed:clinic:dr-szczyt',
    'Dr Szczyt Chirurgia Plastyczna',
    'info@drszczyt.pl',
    'https://www.drszczyt.pl/',
    'Warszawa',
    'Polska',
    'Medycyna estetyczna / klinika',
    null,
    null,
    null,
    'Private plastic surgery clinic in Warsaw with public contact, appointment flow and specialist profiles.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Krolewicza Jakuba 37, 02-956 Warszawa',
    '+48 22 654 90 60',
    'https://www.drszczyt.pl/kontakt',
    'Plastic surgery clinic with direct public email, phone and appointment workflow.',
    array['clinic', 'aesthetic_medicine', 'plastic_surgery', 'premium_healthcare'],
    array['Plastic Surgery', 'Aesthetic Medicine', 'ZnanyLekarz'],
    '[{"label":"Contact","value":"Direct official phone and email on contact page"},{"label":"Workflow","value":"Online consultation booking through doctor profiles"}]'::jsonb,
    '[{"type":"contact","url":"https://www.drszczyt.pl/kontakt","label":"Official contact page"},{"type":"website","url":"https://www.drszczyt.pl/","label":"Official website"}]'::jsonb,
    'found',
    88,
    92,
    now(),
    '{"city":"Warszawa","segment":"premium_healthcare"}'::jsonb
  ),
  (
    'seed:clinic:la-perla-klif',
    'Klinika La Perla - Warszawa Klif',
    'klif@la-perla.pl',
    'https://klinikalaperla.pl/zabiegi-kliniki/warszawa-klif/',
    'Warszawa',
    'Polska',
    'Medycyna estetyczna / beauty',
    null,
    null,
    null,
    'Aesthetic medicine and hi-tech beauty clinic located in Dom Mody Klif in Warsaw.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'DM Klif, ul. Okopowa 58/72, lok. 1.32B, 01-042 Warszawa',
    '+48 882 077 433',
    'https://klinikalaperla.pl/kontakt/',
    'Aesthetic medicine and hi-tech beauty clinic with direct branch email and phone.',
    array['clinic', 'aesthetic_medicine', 'beauty', 'premium_services'],
    array['Aesthetic Medicine', 'Hi-tech Beauty', 'Cosmetology'],
    '[{"label":"Location","value":"Dom Mody Klif Warsaw branch"},{"label":"Offer","value":"Aesthetic medicine, non-invasive rejuvenation and body-shaping technologies"}]'::jsonb,
    '[{"type":"contact","url":"https://klinikalaperla.pl/kontakt/","label":"Official contact page"},{"type":"branch","url":"https://klinikalaperla.pl/zabiegi-kliniki/warszawa-klif/","label":"Official branch page"}]'::jsonb,
    'found',
    88,
    92,
    now(),
    '{"city":"Warszawa","segment":"premium_beauty"}'::jsonb
  ),
  (
    'seed:clinic:la-perla-lowicka',
    'Klinika La Perla - Warszawa Lowicka',
    'lowicka@la-perla.pl',
    'https://klinikalaperla.pl/kontakt/#lowicka',
    'Warszawa',
    'Polska',
    'Medycyna estetyczna / beauty',
    null,
    null,
    null,
    'La Perla Warsaw Lowicka hospital branch with direct public contact details.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Lowicka 21b/1, 02-502 Warszawa',
    '+48 784 066 272',
    'https://klinikalaperla.pl/kontakt/',
    'Aesthetic clinic branch with separate public email, phone and address.',
    array['clinic', 'aesthetic_medicine', 'beauty', 'premium_services'],
    array['Aesthetic Medicine', 'Beauty', 'Hospital Branch'],
    '[{"label":"Contact","value":"Branch-specific public email and phone"},{"label":"Network","value":"Part of Klinika La Perla multi-location network"}]'::jsonb,
    '[{"type":"contact","url":"https://klinikalaperla.pl/kontakt/","label":"Official contact page"}]'::jsonb,
    'found',
    82,
    88,
    now(),
    '{"city":"Warszawa","segment":"premium_beauty"}'::jsonb
  ),
  (
    'seed:clinic:la-perla-krakow',
    'Klinika La Perla - Krakow',
    'krakow@la-perla.pl',
    'https://klinikalaperla.pl/zabiegi-kliniki/krakow/',
    'Krakow',
    'Polska',
    'Medycyna estetyczna / beauty',
    null,
    null,
    null,
    'La Perla Krakow aesthetic clinic branch with direct public contact details.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Szlak 50, lok. A7, 31-153 Krakow',
    '+48 692 209 715',
    'https://klinikalaperla.pl/zabiegi-kliniki/krakow/',
    'Aesthetic clinic branch in Krakow with direct public email and phone.',
    array['clinic', 'aesthetic_medicine', 'beauty', 'premium_services'],
    array['Aesthetic Medicine', 'Beauty', 'Cosmetology'],
    '[{"label":"Location","value":"Krakow branch with public email and phone"},{"label":"Network","value":"Part of Klinika La Perla multi-location network"}]'::jsonb,
    '[{"type":"branch","url":"https://klinikalaperla.pl/zabiegi-kliniki/krakow/","label":"Official branch page"}]'::jsonb,
    'found',
    82,
    88,
    now(),
    '{"city":"Krakow","segment":"premium_beauty"}'::jsonb
  ),
  (
    'seed:clinic:ambroziak',
    'Klinika Ambroziak',
    null,
    'https://klinikaambroziak.pl/',
    'Warszawa',
    'Polska',
    'Medycyna estetyczna / dermatologia',
    null,
    null,
    null,
    'Dermatology, aesthetic medicine, cosmetology and plastic surgery clinic network in Warsaw, Piaseczno and Marbella.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'al. Gen. W. Sikorskiego 13/U1, 02-758 Warszawa',
    '+48 22 111 50 05',
    'https://klinikaambroziak.pl/kontakt',
    'Premium dermatology and aesthetic medicine clinic network with multiple branches and public phone/contact page.',
    array['clinic', 'dermatology', 'aesthetic_medicine', 'plastic_surgery', 'premium_healthcare'],
    array['Dermatology', 'Aesthetic Medicine', 'Cosmetology', 'Plastic Surgery'],
    '[{"label":"Network","value":"Multiple Warsaw/Piaseczno branches and Marbella presence"},{"label":"Offer","value":"Dermatology, aesthetic medicine, cosmetology and plastic surgery"}]'::jsonb,
    '[{"type":"contact","url":"https://klinikaambroziak.pl/kontakt","label":"Official contact page"},{"type":"contact_en","url":"https://www.klinikaambroziak.com/contact","label":"Official English contact page"}]'::jsonb,
    'unknown',
    70,
    78,
    now(),
    '{"city":"Warszawa","segment":"premium_healthcare"}'::jsonb
  ),
  (
    'seed:hotel:raffles-europejski',
    'Raffles Europejski Warsaw',
    'warsaw@raffles.com',
    'https://www.raffles.com/warsaw/',
    'Warszawa',
    'Polska',
    'Hotel / hospitality premium',
    null,
    null,
    null,
    'Luxury hotel on Warsaw Royal Route with direct public hotel email and phone.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'Krakowskie Przedmiescie 13, 00-071 Warszawa',
    '+48 22 255 95 00',
    'https://www.europejski.pl/contact/',
    'Premium hospitality venue with direct sales-ready contact and strong luxury positioning.',
    array['hotel', 'hospitality', 'luxury', 'events', 'premium_services'],
    array['Hospitality', 'Luxury Hotel', 'Events', 'Spa'],
    '[{"label":"Positioning","value":"Luxury hotel in one of Warsaw most prestigious locations"},{"label":"Contact","value":"Direct public hotel email and phone"}]'::jsonb,
    '[{"type":"contact","url":"https://www.europejski.pl/contact/","label":"Official Europejski contact page"},{"type":"about","url":"https://www.raffles.com/warsaw/about/","label":"Official Raffles about page"}]'::jsonb,
    'found',
    90,
    92,
    now(),
    '{"city":"Warszawa","segment":"premium_hospitality"}'::jsonb
  ),
  (
    'seed:hotel:flaner',
    'Flaner Hotel Warszawa',
    'sales@flanerhotel.com',
    'https://flanerhotel.com/',
    'Warszawa',
    'Polska',
    'Hotel / hospitality',
    null,
    null,
    null,
    'Four-star hotel in Warsaw with separate public contacts for reception, restaurant, sales/events/groups and marketing.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'Krakowskie Przedmiescie 4, 00-333 Warszawa',
    '+48 730 002 599',
    'https://flanerhotel.com/kontakt/',
    'Hotel with public sales/events email, restaurant email and marketing email, useful for hospitality outreach.',
    array['hotel', 'hospitality', 'events', 'restaurant', 'warsaw'],
    array['Hospitality', 'Events', 'Restaurant', 'Marketing'],
    '[{"label":"Contact routing","value":"Separate public emails for reception, restaurant, sales/events/groups and marketing"},{"label":"Location","value":"Krakowskie Przedmiescie in Warsaw"}]'::jsonb,
    '[{"type":"contact","url":"https://flanerhotel.com/kontakt/","label":"Official contact page"}]'::jsonb,
    'found',
    88,
    90,
    now(),
    '{"city":"Warszawa","segment":"hospitality"}'::jsonb
  ),
  (
    'seed:hotel:hotel-boss',
    'Hotel Boss Warszawa',
    'sprzedaz@hotelboss.pl',
    'https://www.hotelboss.pl/',
    'Warszawa',
    'Polska',
    'Hotel / event venue',
    null,
    null,
    null,
    'Warsaw hotel and conference/event venue with public emails for hotel, sales, events, marketing, accounting and management.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Zwanowiecka 20, 04-849 Warszawa',
    '+48 22 51 66 302',
    'https://www.hotelboss.pl/kontakt',
    'Hotel and conference/event venue with direct public sales email and multiple departmental contacts.',
    array['hotel', 'hospitality', 'events', 'conferences', 'weddings'],
    array['Hospitality', 'Events', 'Conferences', 'Weddings'],
    '[{"label":"Departmental contacts","value":"Public sales, events, marketing and hotel emails listed"},{"label":"Use case","value":"Good fit for local B2B/event/hospitality outbound segments"}]'::jsonb,
    '[{"type":"contact","url":"https://www.hotelboss.pl/kontakt","label":"Official contact page"}]'::jsonb,
    'found',
    86,
    90,
    now(),
    '{"city":"Warszawa","segment":"hospitality_events"}'::jsonb
  ),
  (
    'seed:hotel:nobu-warsaw',
    'Nobu Hotel Warsaw',
    null,
    'https://www.nobuhotels.com/warsaw/',
    'Warszawa',
    'Polska',
    'Hotel / hospitality premium',
    null,
    null,
    null,
    'Premium Warsaw hotel with public phone numbers for general enquiries, front desk, reservations, restaurant and sales/events.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Wilcza 73, 00-670 Warszawa',
    '+48 22 551 88 88',
    'https://www.nobuhotels.com/warsaw/contact-us/',
    'Premium hotel and restaurant venue with clear public sales/events and reservation contacts.',
    array['hotel', 'hospitality', 'luxury', 'restaurant', 'events'],
    array['Hospitality', 'Restaurant', 'Events', 'Luxury Hotel'],
    '[{"label":"Contact routing","value":"Public phone numbers for general, reservations, restaurant and sales/events"},{"label":"Location","value":"Wilcza 73, Warsaw"}]'::jsonb,
    '[{"type":"contact","url":"https://www.nobuhotels.com/warsaw/contact-us/","label":"Official contact page"}]'::jsonb,
    'unknown',
    72,
    80,
    now(),
    '{"city":"Warszawa","segment":"premium_hospitality"}'::jsonb
  ),
  (
    'seed:real-estate:hamilton-may',
    'Hamilton May',
    'warsaw@hamiltonmay.com',
    'https://www.hamiltonmay.com/',
    'Warszawa',
    'Polska',
    'Nieruchomosci premium',
    null,
    null,
    null,
    'Premium residential real estate agency operating in Warsaw, Krakow and Wroclaw with residential sales, letting and property management.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'Sienna 39, 00-121 Warszawa',
    '+48 22 428 16 15',
    'https://www.hamiltonmay.com/contact',
    'Premium real estate agency with multi-city footprint and property management/investment services.',
    array['real_estate', 'premium_real_estate', 'property_management', 'warsaw', 'krakow', 'wroclaw'],
    array['Residential Sales', 'Letting', 'Property Management', 'PRS', 'Relocation'],
    '[{"label":"Footprint","value":"Warsaw, Krakow and Wroclaw offices"},{"label":"Positioning","value":"Premium residential sales, lettings and property management"}]'::jsonb,
    '[{"type":"contact","url":"https://www.hamiltonmay.com/contact","label":"Official contact page"},{"type":"website","url":"https://www.hamiltonmay.com/","label":"Official website"}]'::jsonb,
    'found',
    88,
    82,
    now(),
    '{"city":"Warszawa","segment":"premium_real_estate"}'::jsonb
  ),
  (
    'seed:real-estate:lions-estate',
    'Lions Estate',
    null,
    'https://lionsestate.pl/',
    'Warszawa',
    'Polska',
    'Nieruchomosci premium',
    null,
    null,
    null,
    'Premium real estate agency in Warsaw focused on selling property quickly or at the highest possible price.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Wiejska 11/20, 00-480 Warszawa',
    '+48 22 826 66 51',
    'https://lionsestate.pl/en/kontakt',
    'Premium real estate agency with public phone, address and sales-focused positioning.',
    array['real_estate', 'premium_real_estate', 'warsaw', 'property_sales'],
    array['Real Estate Sales', 'Premium Property', 'Valuation'],
    '[{"label":"Positioning","value":"Speed of transaction or highest possible price sales promise"},{"label":"Location","value":"Wiejska 11/20, Warsaw"}]'::jsonb,
    '[{"type":"contact","url":"https://lionsestate.pl/en/kontakt","label":"Official contact page"}]'::jsonb,
    'unknown',
    72,
    80,
    now(),
    '{"city":"Warszawa","segment":"premium_real_estate"}'::jsonb
  ),
  (
    'seed:real-estate:partners-international',
    'Partners International',
    'info@partnersinternational.pl',
    'https://partnersinternational.pl/',
    'Warszawa',
    'Polska',
    'Nieruchomosci premium',
    null,
    null,
    null,
    'Premium real estate agency with 30-year positioning and offices in Warsaw and other Polish cities.',
    null,
    null,
    'public directory / official contact pages',
    'enriched',
    now(),
    'Fort Pilsudskiego 2, 02-704 Warszawa',
    '+48 22 646 52 02',
    'https://partnersinternational.de/kontakt',
    'Premium real estate agency with long-market positioning and public general contact email.',
    array['real_estate', 'premium_real_estate', 'luxury_property', 'warsaw'],
    array['Luxury Real Estate', 'Sales', 'Rentals'],
    '[{"label":"Positioning","value":"30-year premium real estate agency positioning"},{"label":"Contact","value":"Public email and phone listed in public directories/contact pages"}]'::jsonb,
    '[{"type":"contact","url":"https://partnersinternational.de/kontakt","label":"Contact page mirror"},{"type":"directory","url":"https://www.krn.pl/biuro-posrednictwa/partners-international%2C2850","label":"Public real estate directory"}]'::jsonb,
    'found',
    74,
    72,
    now(),
    '{"city":"Warszawa","segment":"premium_real_estate"}'::jsonb
  ),
  (
    'seed:ecommerce:modivo',
    'MODIVO',
    'info@modivo.pl',
    'https://modivo.pl/',
    'Zielona Gora',
    'Polska',
    'E-commerce / fashion',
    'https://www.instagram.com/modivo',
    null,
    'https://www.facebook.com/modivopl',
    'Fashion e-commerce brand and marketplace with public customer contact and group-level corporate data.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Nowy Kisielin - Naukowa 15, 66-002 Zielona Gora',
    '+48 22 123 0 123',
    'https://modivo.pl/kontakt',
    'Large fashion e-commerce player with public contact, app, marketplace and group-level corporate footprint.',
    array['ecommerce', 'fashion', 'marketplace', 'retail'],
    array['E-commerce', 'Marketplace', 'Mobile App', 'Fashion Retail'],
    '[{"label":"Channel","value":"Online store, app and marketplace support workflows"},{"label":"Corporate","value":"Part of MODIVO group with public corporate contacts"}]'::jsonb,
    '[{"type":"contact","url":"https://modivo.pl/kontakt","label":"Official contact page"},{"type":"privacy","url":"https://modivo.pl/b/ochrona-danych","label":"Official data protection page with company emails"}]'::jsonb,
    'found',
    86,
    88,
    now(),
    '{"segment":"ecommerce_fashion"}'::jsonb
  ),
  (
    'seed:ecommerce:coffeedesk',
    'Coffeedesk',
    null,
    'https://www.coffeedesk.pl/',
    'Kolobrzeg',
    'Polska',
    'E-commerce / coffee',
    null,
    null,
    null,
    'Coffee e-commerce brand with cafes and public customer service/contact channels.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Mazowiecka 24I/U9, 78-100 Kolobrzeg',
    '+48 730 88 25 25',
    'https://www.coffeedesk.pl/coffeedesk/kontakt/',
    'Coffee e-commerce and cafe brand with public customer service phone and multi-location offline presence.',
    array['ecommerce', 'coffee', 'retail', 'cafes', 'consumer_brand'],
    array['E-commerce', 'Retail', 'Customer Service', 'Cafes'],
    '[{"label":"Model","value":"E-commerce plus physical cafe locations"},{"label":"Contact","value":"Public customer service and service contact channels"}]'::jsonb,
    '[{"type":"contact","url":"https://www.coffeedesk.pl/coffeedesk/kontakt/","label":"Official contact page"},{"type":"contact_en","url":"https://www.coffeedesk.com/about-coffeedesk/contact/","label":"Official English contact page"}]'::jsonb,
    'unknown',
    72,
    78,
    now(),
    '{"segment":"ecommerce_coffee"}'::jsonb
  ),
  (
    'seed:ecommerce:gymbeam',
    'GymBeam',
    null,
    'https://gymbeam.pl/',
    'Warszawa',
    'Polska',
    'E-commerce / supplements',
    null,
    null,
    null,
    'Fitness and supplements e-commerce brand with public Polish customer service and collaboration/media contact flow.',
    null,
    null,
    'official website',
    'enriched',
    now(),
    'ul. Towarowa 7, 00-839 Warszawa',
    '+48 22 292 54 80',
    'https://gymbeam.pl/content/kontakt',
    'Fitness and supplements e-commerce brand with public customer service and collaboration/media contact paths.',
    array['ecommerce', 'fitness', 'supplements', 'consumer_brand'],
    array['E-commerce', 'Supplements', 'Fitness', 'Mobile App'],
    '[{"label":"Scale signal","value":"Public website communicates large customer base and broad assortment"},{"label":"Contact","value":"Polish customer service phone and collaboration/media contacts"}]'::jsonb,
    '[{"type":"contact","url":"https://gymbeam.pl/content/kontakt","label":"Official contact page"},{"type":"website","url":"https://gymbeam.pl/","label":"Official website"}]'::jsonb,
    'unknown',
    70,
    78,
    now(),
    '{"city":"Warszawa","segment":"ecommerce_fitness"}'::jsonb
  )
on conflict (website) do update
set
  query_hash = excluded.query_hash,
  company_name = excluded.company_name,
  email = coalesce(excluded.email, global_leads.email),
  city = excluded.city,
  country = excluded.country,
  industry = excluded.industry,
  instagram_url = coalesce(excluded.instagram_url, global_leads.instagram_url),
  linkedin_url = coalesce(excluded.linkedin_url, global_leads.linkedin_url),
  facebook_url = coalesce(excluded.facebook_url, global_leads.facebook_url),
  linkedin_bio = excluded.linkedin_bio,
  instagram_last_post = excluded.instagram_last_post,
  ai_icebreaker = excluded.ai_icebreaker,
  email_source = excluded.email_source,
  enrichment_status = excluded.enrichment_status,
  enriched_at = excluded.enriched_at,
  address = excluded.address,
  phone = excluded.phone,
  contact_page_url = excluded.contact_page_url,
  description = excluded.description,
  category_tags = excluded.category_tags,
  technologies = excluded.technologies,
  business_signals = excluded.business_signals,
  data_sources = excluded.data_sources,
  contact_status = excluded.contact_status,
  data_quality_score = excluded.data_quality_score,
  source_confidence = excluded.source_confidence,
  last_checked_at = excluded.last_checked_at,
  public_profile = excluded.public_profile;

drop function if exists public.zec_preview_global_leads(integer);
drop function if exists public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean);
drop function if exists public.zec_unlock_global_leads(uuid[], text);

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
    gl.id,
    gl.query_hash,
    gl.company_name,
    case
      when ugl.global_lead_id is not null or ul.id is not null then gl.email
      else null::text
    end as email,
    gl.website,
    gl.city,
    gl.industry,
    gl.instagram_url,
    gl.linkedin_url,
    gl.facebook_url,
    gl.linkedin_bio,
    gl.instagram_last_post,
    null::text as ai_icebreaker,
    gl.email_source,
    gl.enrichment_status,
    gl.enriched_at,
    gl.created_at,
    gl.country,
    gl.region,
    gl.address,
    gl.phone,
    gl.contact_page_url,
    gl.description,
    gl.category_tags,
    gl.technologies,
    gl.business_signals,
    gl.data_sources,
    gl.contact_status,
    gl.data_quality_score,
    gl.source_confidence,
    gl.last_checked_at,
    gl.public_profile,
    (ugl.global_lead_id is not null or ul.id is not null) as is_unlocked,
    coalesce(ugl.unlock_depth, case when ul.id is not null then 'basic' else null end) as unlock_depth,
    (gl.email is not null) as email_available
  from public.global_leads gl
  left join public.user_unlocked_global_leads ugl
    on ugl.global_lead_id = gl.id
   and ugl.user_id = v_user_id
  left join public.user_leads ul
    on ul.global_lead_id = gl.id
   and ul.user_id = v_user_id
  where gl.company_name is not null
  order by
    coalesce(gl.data_quality_score, 0) desc,
    coalesce(gl.source_confidence, 0) desc,
    (gl.email is not null) desc,
    gl.created_at desc
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

  select coalesce(p.credits, 0)
  into v_credits_after
  from public.profiles p
  where p.id = v_user_id;

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
      gl.*,
      public.zec_global_lead_search_text(gl) as haystack,
      (ugl.global_lead_id is not null or ul.id is not null) as is_unlocked,
      coalesce(ugl.unlock_depth, case when ul.id is not null then 'basic' else null end) as unlock_depth
    from public.global_leads gl
    left join public.user_unlocked_global_leads ugl
      on ugl.global_lead_id = gl.id
     and ugl.user_id = v_user_id
    left join public.user_leads ul
      on ul.global_lead_id = gl.id
     and ul.user_id = v_user_id
  ),
  filtered as (
    select p.*
    from prepared p
    where (not coalesce(p_require_email, true) or p.email is not null)
      and (not coalesce(p_require_website, false) or p.website is not null)
      and (
        not coalesce(p_require_social, false)
        or p.instagram_url is not null
        or p.linkedin_url is not null
        or p.facebook_url is not null
      )
      and (
        not coalesce(p_only_enriched, false)
        or p.enrichment_status = 'enriched'
        or p.data_quality_score >= 70
        or jsonb_array_length(coalesce(p.business_signals, '[]'::jsonb)) > 0
      )
      and (
        v_city is null
        or public.zec_normalize_search_text(coalesce(p.city, '')) like '%' || v_city || '%'
        or public.zec_normalize_search_text(coalesce(p.country, '')) like '%' || v_city || '%'
      )
      and (
        cardinality(v_all_tokens) = 0
        or exists (
          select 1
          from unnest(v_all_tokens) as token(value)
          where p.haystack like '%' || public.zec_normalize_search_text(token.value) || '%'
        )
      )
  )
  select count(*)::integer into v_total_matches
  from filtered;

  insert into public.search_requests (user_id, query_hash, status, leads_requested, leads_found)
  values (v_user_id, v_query_hash, 'completed', v_limit, v_total_matches);

  return query
  with prepared as (
    select
      gl.*,
      public.zec_global_lead_search_text(gl) as haystack,
      (ugl.global_lead_id is not null or ul.id is not null) as is_unlocked,
      coalesce(ugl.unlock_depth, case when ul.id is not null then 'basic' else null end) as unlock_depth
    from public.global_leads gl
    left join public.user_unlocked_global_leads ugl
      on ugl.global_lead_id = gl.id
     and ugl.user_id = v_user_id
    left join public.user_leads ul
      on ul.global_lead_id = gl.id
     and ul.user_id = v_user_id
  ),
  filtered as (
    select
      p.*,
      (
        case
          when v_city is not null and public.zec_normalize_search_text(coalesce(p.city, '')) like '%' || v_city || '%' then 28
          when v_city is not null and public.zec_normalize_search_text(coalesce(p.country, '')) like '%' || v_city || '%' then 10
          else 0
        end
        +
        coalesce((
          select sum(case when p.haystack like '%' || public.zec_normalize_search_text(token.value) || '%' then 12 else 0 end)
          from unnest(v_all_tokens) as token(value)
        ), 0)
        +
        case when p.email is not null then 10 else 0 end
        +
        case when p.website is not null then 6 else 0 end
        +
        least(coalesce(p.data_quality_score, 0), 100) / 5
        +
        case when p.enrichment_status = 'enriched' then 8 else 0 end
        +
        case when p.instagram_url is not null or p.linkedin_url is not null or p.facebook_url is not null then 5 else 0 end
      ) as match_score
    from prepared p
    where (not coalesce(p_require_email, true) or p.email is not null)
      and (not coalesce(p_require_website, false) or p.website is not null)
      and (
        not coalesce(p_require_social, false)
        or p.instagram_url is not null
        or p.linkedin_url is not null
        or p.facebook_url is not null
      )
      and (
        not coalesce(p_only_enriched, false)
        or p.enrichment_status = 'enriched'
        or p.data_quality_score >= 70
        or jsonb_array_length(coalesce(p.business_signals, '[]'::jsonb)) > 0
      )
      and (
        v_city is null
        or public.zec_normalize_search_text(coalesce(p.city, '')) like '%' || v_city || '%'
        or public.zec_normalize_search_text(coalesce(p.country, '')) like '%' || v_city || '%'
      )
      and (
        cardinality(v_all_tokens) = 0
        or exists (
          select 1
          from unnest(v_all_tokens) as token(value)
          where p.haystack like '%' || public.zec_normalize_search_text(token.value) || '%'
        )
      )
  ),
  ranked as (
    select *
    from filtered
    order by
      match_score desc,
      coalesce(data_quality_score, 0) desc,
      coalesce(source_confidence, 0) desc,
      (email is not null) desc,
      created_at desc
    limit v_limit
  )
  select
    r.id,
    r.query_hash,
    r.company_name,
    case when r.is_unlocked then r.email else null::text end as email,
    r.website,
    r.city,
    r.industry,
    r.instagram_url,
    r.linkedin_url,
    r.facebook_url,
    r.linkedin_bio,
    r.instagram_last_post,
    null::text as ai_icebreaker,
    r.email_source,
    r.enrichment_status,
    r.enriched_at,
    r.created_at,
    v_credits_after as credits_after,
    0 as charged_credits,
    v_total_matches as total_matches,
    r.country,
    r.region,
    r.address,
    r.phone,
    r.contact_page_url,
    r.description,
    r.category_tags,
    r.technologies,
    r.business_signals,
    r.data_sources,
    r.contact_status,
    r.data_quality_score,
    r.source_confidence,
    r.last_checked_at,
    r.public_profile,
    r.is_unlocked,
    r.unlock_depth,
    (r.email is not null) as email_available
  from ranked r;
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

  select coalesce(p.credits, 0)
  into v_balance
  from public.profiles p
  where p.id = v_user_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  with requested as (
    select distinct lead_id
    from unnest(p_lead_ids) as item(lead_id)
  ),
  targets as (
    select
      gl.id,
      greatest(
        case ugl.unlock_depth when 'enriched' then 2 when 'basic' then 1 else 0 end,
        case when ul.id is not null then v_requested_rank else 0 end
      ) as existing_rank
    from requested r
    join public.global_leads gl on gl.id = r.lead_id
    left join public.user_unlocked_global_leads ugl
      on ugl.global_lead_id = gl.id
     and ugl.user_id = v_user_id
    left join public.user_leads ul
      on ul.global_lead_id = gl.id
     and ul.user_id = v_user_id
    where gl.email is not null
  ),
  priced as (
    select
      id,
      case
        when existing_rank >= v_requested_rank then 0
        when v_requested_depth = 'basic' then 1
        when existing_rank = 1 then 2
        else 3
      end as cost
    from targets
  )
  select coalesce(sum(cost), 0)::integer, count(*)::integer
  into v_charge, v_unlockable_count
  from priced;

  if v_unlockable_count = 0 then
    raise exception 'No unlockable leads with email found';
  end if;

  if v_charge > v_balance then
    raise exception 'Insufficient credits';
  end if;

  if v_charge > 0 then
    update public.profiles
    set credits = coalesce(credits, 0) - v_charge
    where id = v_user_id
    returning coalesce(credits, 0)
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
    select distinct lead_id
    from unnest(p_lead_ids) as item(lead_id)
  ),
  targets as (
    select
      gl.id,
      greatest(
        case ugl.unlock_depth when 'enriched' then 2 when 'basic' then 1 else 0 end,
        case when ul.id is not null then v_requested_rank else 0 end
      ) as existing_rank
    from requested r
    join public.global_leads gl on gl.id = r.lead_id
    left join public.user_unlocked_global_leads ugl
      on ugl.global_lead_id = gl.id
     and ugl.user_id = v_user_id
    left join public.user_leads ul
      on ul.global_lead_id = gl.id
     and ul.user_id = v_user_id
    where gl.email is not null
  ),
  priced as (
    select
      id,
      case
        when existing_rank >= v_requested_rank then 0
        when v_requested_depth = 'basic' then 1
        when existing_rank = 1 then 2
        else 3
      end as cost
    from targets
  )
  insert into public.user_unlocked_global_leads (user_id, global_lead_id, unlock_depth, credits_spent)
  select v_user_id, id, v_requested_depth, cost
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
    gl.id,
    gl.query_hash,
    gl.company_name,
    gl.email,
    gl.website,
    gl.city,
    gl.industry,
    gl.instagram_url,
    gl.linkedin_url,
    gl.facebook_url,
    gl.linkedin_bio,
    gl.instagram_last_post,
    null::text as ai_icebreaker,
    gl.email_source,
    gl.enrichment_status,
    gl.enriched_at,
    gl.created_at,
    v_balance_after as credits_after,
    v_charge as charged_credits,
    v_unlockable_count as total_matches,
    gl.country,
    gl.region,
    gl.address,
    gl.phone,
    gl.contact_page_url,
    gl.description,
    gl.category_tags,
    gl.technologies,
    gl.business_signals,
    gl.data_sources,
    gl.contact_status,
    gl.data_quality_score,
    gl.source_confidence,
    gl.last_checked_at,
    gl.public_profile,
    true as is_unlocked,
    ugl.unlock_depth,
    (gl.email is not null) as email_available
  from public.global_leads gl
  join public.user_unlocked_global_leads ugl
    on ugl.global_lead_id = gl.id
   and ugl.user_id = v_user_id
  where gl.id = any(p_lead_ids)
    and gl.email is not null
  order by gl.company_name;
end;
$$;

revoke execute on function public.zec_preview_global_leads(integer) from anon;
revoke execute on function public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean) from anon;
revoke execute on function public.zec_unlock_global_leads(uuid[], text) from anon;
grant execute on function public.zec_preview_global_leads(integer) to authenticated;
grant execute on function public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean) to authenticated;
grant execute on function public.zec_unlock_global_leads(uuid[], text) to authenticated;
