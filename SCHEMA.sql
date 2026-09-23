-- RSC Supabase schema. Run in SQL editor in order.
create extension if not exists "pgcrypto";

-- ---------- enums
create type member_status as enum ('active','paused','withdrawn');
create type member_role as enum ('member','admin','owner');   -- owner: 주관리자 (M12)
create type program_kind as enum ('single','season');
create type booking_status as enum ('pending','confirmed','cancelled','expired','attended');
create type payment_status as enum ('ready','paid','cancelled','partial_cancelled','failed');
create type inquiry_status as enum ('pending','contacted','invited','closed');

-- ---------- members (1:1 with auth.users)
create table members (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  role member_role not null default 'member',
  status member_status not null default 'active',
  invite_code_id uuid,
  memo text,
  provider text not null default 'email',    -- 가입 경로: email | kakao | google (M7)
  last_login_at timestamptz,                  -- M12
  created_at timestamptz not null default now()
);

-- ---------- membership plans (pricing page reads from here)
create table membership_plans (
  id text primary key,                       -- 'preview','access','signature'
  name text not null,
  price int not null,                        -- KRW, VAT incl.
  founding_price int,
  period_months int,                          -- null = one-off
  basic_events int, premium_events int, invites int,
  meeting_room int, seminar_room int, connection_included int,
  description text,
  sort int default 0
);
insert into membership_plans values
 ('preview','RSC PREVIEW',165000,null,null,1,0,0,0,0,0,'가입 전 1회 경험',1),
 ('access','RSC ACCESS',3300000,2400000,12,8,0,8,2,2,1,'검증된 싱글 커뮤니티',2),
 ('signature','RSC SIGNATURE',8800000,7200000,12,18,4,12,4,4,3,'커뮤니티 + 관계 프로그램 + 컨시어지',3);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  plan_id text not null references membership_plans(id),
  starts_at date not null,
  ends_at date,
  is_founding boolean default false,
  paid_amount int not null,
  payment_id uuid,
  status text not null default 'active',     -- active | expired | held | cancelled
  created_at timestamptz default now()
);

-- ---------- programs & sessions
create table programs (
  id uuid primary key default gen_random_uuid(),
  kind program_kind not null default 'single',
  name text not null,
  subtitle text,
  category text,                              -- WELLNESS | WINE | SOCIAL | CULTURE | SOLO
  place text,
  short_desc text,
  description text,
  image_url text,
  flow jsonb default '[]',                    -- [{"t":"10:00","d":"체크인"}]
  capacity int not null default 20,
  price int not null,
  member_price int,
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table sessions (                       -- one row per date (season = 6 rows)
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity int not null,
  seq int default 1,                          -- season week number
  status text default 'open'                  -- open | closed | cancelled
);
create index on sessions(program_id, starts_at);

-- ---------- bookings & payments
create table bookings (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,              -- 'RSC-20260918-XXXX' (sent to Toss as orderId)
  member_id uuid not null references members(id),
  program_id uuid not null references programs(id),
  session_id uuid not null references sessions(id),
  qty int not null default 1,
  unit_price int not null,
  amount int not null,
  status booking_status not null default 'pending',
  expires_at timestamptz not null default now() + interval '15 minutes',
  cancelled_at timestamptz,
  created_at timestamptz default now()
);
create index on bookings(member_id, status);
create index on bookings(session_id, status);

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  membership_id uuid references memberships(id),
  member_id uuid not null references members(id),
  provider text not null default 'toss',
  payment_key text unique,                    -- Toss paymentKey
  order_id text not null,
  method text,                                -- 카드 | 카카오페이 | 네이버페이 | 토스페이 | 계좌이체
  amount int not null,
  status payment_status not null default 'ready',
  receipt_url text,
  raw jsonb,                                  -- Toss confirm response
  approved_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);

-- ---------- inquiries (Fit Check) & invites
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  name text, phone text, email text,
  answers jsonb not null,
  result_type text,
  status inquiry_status not null default 'pending',
  memo text,
  created_at timestamptz default now()
);

create table invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                  -- RSC-XXXX-XXXX
  inquiry_id uuid references inquiries(id),
  issued_to_name text, issued_to_phone text,
  expires_at timestamptz default now() + interval '30 days',
  used_by uuid references members(id),
  used_at timestamptz,
  created_by uuid references members(id),
  created_at timestamptz default now()
);

create table guest_passes (                    -- 지인 초대권 (연 8/12매)
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id),
  membership_id uuid references memberships(id),
  booking_id uuid references bookings(id),
  guest_name text,
  used_at timestamptz default now()
);

-- ---------- seat reservation (atomic)
create or replace function reserve_seat(p_session uuid, p_member uuid, p_qty int)
returns bookings language plpgsql security definer as $$
declare s sessions; p programs; taken int; b bookings; oid text;
begin
  select * into s from sessions where id = p_session for update;
  if s is null or s.status <> 'open' then raise exception 'SESSION_CLOSED'; end if;
  select * into p from programs where id = s.program_id;
  select coalesce(sum(qty),0) into taken from bookings
    where session_id = p_session and status in ('pending','confirmed','attended')
      and (status <> 'pending' or expires_at > now());
  if taken + p_qty > s.capacity then raise exception 'SOLD_OUT'; end if;
  oid := 'RSC-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text,1,6));
  insert into bookings(order_id, member_id, program_id, session_id, qty, unit_price, amount)
    values (oid, p_member, p.id, p_session, p_qty, coalesce(p.member_price, p.price), coalesce(p.member_price, p.price) * p_qty)
    returning * into b;
  return b;
end $$;

-- remaining seats view
create view session_availability as
select s.id as session_id, s.program_id, s.starts_at, s.capacity,
  s.capacity - coalesce((select sum(qty) from bookings b where b.session_id = s.id
     and b.status in ('confirmed','attended') or (b.session_id = s.id and b.status='pending' and b.expires_at > now())),0) as remaining
from sessions s;

-- expire abandoned pending bookings (schedule with pg_cron every 5 min)
create or replace function expire_pending_bookings() returns void language sql as $$
  update bookings set status='expired' where status='pending' and expires_at < now();
$$;

-- ---------- RLS
alter table members enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table memberships enable row level security;
alter table programs enable row level security;
alter table sessions enable row level security;
alter table inquiries enable row level security;
alter table invite_codes enable row level security;
alter table guest_passes enable row level security;
alter table membership_plans enable row level security;

-- SECURITY DEFINER: members RLS 정책 안에서 members 를 다시 읽을 때 무한 재귀를 막는다.
-- is_admin: 부관리자·주관리자 모두. 정지(paused)·탈퇴 계정은 권한 없음 (M12)
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from members where id = auth.uid() and role in ('admin','owner') and status = 'active');
$$;
grant execute on function is_admin() to anon, authenticated;
create or replace function is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from members where id = auth.uid() and role = 'owner' and status = 'active');
$$;
grant execute on function is_owner() to anon, authenticated;

create policy "self read" on members for select using (id = auth.uid() or is_admin());
create policy "self update" on members for update using (id = auth.uid() or is_admin());
create policy "admin all members" on members for all using (is_admin());

create policy "published programs" on programs for select using (is_published or is_admin());
create policy "admin programs" on programs for all using (is_admin());
create policy "sessions read" on sessions for select using (true);
create policy "admin sessions" on sessions for all using (is_admin());
create policy "plans read" on membership_plans for select using (true);
create policy "admin plans" on membership_plans for all using (is_admin());

create policy "own bookings" on bookings for select using (member_id = auth.uid() or is_admin());
create policy "admin bookings" on bookings for all using (is_admin());
create policy "own payments" on payments for select using (member_id = auth.uid() or is_admin());
create policy "own memberships" on memberships for select using (member_id = auth.uid() or is_admin());
create policy "own passes" on guest_passes for select using (member_id = auth.uid() or is_admin());

create policy "anyone can submit inquiry" on inquiries for insert with check (true);
create policy "admin inquiries" on inquiries for all using (is_admin());
create policy "admin invites" on invite_codes for all using (is_admin());
-- invite code validation & booking/payment writes go through server Route Handlers using the service role key.

-- ---------- auth trigger: create members row on signup
-- 이메일 가입은 메타데이터의 invite_code 가 유효해야만 계정이 만들어진다 (초대제 원칙을 DB에서 강제).
-- 소셜 가입은 코드 없이 계정이 만들어지고, members.invite_code_id 가 비어 있으면 앱에서 코드 입력을 요구한다.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare v_code text; v invite_codes; v_provider text; v_inv admin_invites; v_inv_id uuid;
begin
  v_provider := coalesce(new.raw_app_meta_data->>'provider', 'email');
  -- M12: admin_invite(초대 id, user_metadata 또는 app_metadata) 가 있고 초대 이메일이 계정 이메일과 같으면 초대코드 없이 관리자 계정.
  -- (GoTrue admin createUser 는 app_metadata 를 INSERT 뒤에 붙일 수 있어 user_metadata 로도 받는다)
  v_inv_id := nullif(coalesce(new.raw_app_meta_data->>'admin_invite', new.raw_user_meta_data->>'admin_invite', ''), '')::uuid;
  if v_inv_id is not null then
    select * into v_inv from admin_invites where id = v_inv_id for update;
    if v_inv.id is null or v_inv.used_at is not null or v_inv.revoked_at is not null or v_inv.expires_at < now()
       or lower(v_inv.email) <> lower(coalesce(new.email, '')) then
      raise exception 'ADMIN_INVITE_INVALID';
    end if;
    insert into members(id, name, email, role, provider)
    values (new.id, coalesce(nullif(new.raw_user_meta_data->>'name', ''), v_inv.name, ''), new.email, v_inv.role, v_provider)
    on conflict (id) do nothing;
    update admin_invites set used_at = now(), used_by = new.id where id = v_inv.id;
    return new;
  end if;
  v_code := upper(trim(coalesce(new.raw_user_meta_data->>'invite_code', '')));
  if v_code <> '' then
    select * into v from invite_codes where code = v_code for update;
  end if;
  if v_provider = 'email' then
    if v.id is null then raise exception 'INVITE_REQUIRED'; end if;
    if v.used_by is not null or (v.expires_at is not null and v.expires_at < now()) then raise exception 'INVITE_INVALID'; end if;
  end if;
  insert into members(id, name, email, phone, invite_code_id, provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    case when v.id is not null and v.used_by is null then v.id else null end,
    v_provider
  )
  on conflict (id) do nothing;
  if v.id is not null and v.used_by is null then
    update invite_codes set used_by = new.id, used_at = now() where id = v.id;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- invite code RPCs (M3)
-- 가입 전 검증: 로그인 없이 호출. 코드 존재·미사용·미만료 여부만 알려준다.
create or replace function verify_invite_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v invite_codes;
begin
  select * into v from invite_codes where code = upper(trim(p_code));
  if v.id is null then return jsonb_build_object('valid', false, 'reason', 'NOT_FOUND'); end if;
  if v.used_by is not null then return jsonb_build_object('valid', false, 'reason', 'USED'); end if;
  if v.expires_at is not null and v.expires_at < now() then return jsonb_build_object('valid', false, 'reason', 'EXPIRED'); end if;
  return jsonb_build_object('valid', true, 'code', v.code, 'name', v.issued_to_name);
end $$;
revoke all on function verify_invite_code(text) from public;
grant execute on function verify_invite_code(text) to anon, authenticated;

-- 로그인한 사용자가 코드를 사용 처리한다 (소셜 가입 후 코드 입력). 원자적.
create or replace function consume_invite_code(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v invite_codes; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v from invite_codes where code = upper(trim(p_code)) for update;
  if v.id is null or v.used_by is not null or (v.expires_at is not null and v.expires_at < now()) then return false; end if;
  update invite_codes set used_by = uid, used_at = now() where id = v.id;
  update members set invite_code_id = v.id where id = uid;
  return true;
end $$;
revoke all on function consume_invite_code(text) from public, anon;
grant execute on function consume_invite_code(text) to authenticated;

-- ---------- invite code issue (M4, 어드민 전용, 30일 만료)
create or replace function issue_invite_code(p_inquiry uuid default null, p_name text default null, p_phone text default null)
returns invite_codes language plpgsql security definer set search_path = public as $$
declare v invite_codes; v_code text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  loop
    v_code := 'RSC-';
    for i in 1..8 loop
      v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      if i = 4 then v_code := v_code || '-'; end if;
    end loop;
    exit when not exists (select 1 from invite_codes where code = v_code);
  end loop;
  insert into invite_codes(code, inquiry_id, issued_to_name, issued_to_phone, expires_at, created_by)
  values (v_code, p_inquiry, p_name, p_phone, now() + interval '30 days', auth.uid())
  returning * into v;
  if p_inquiry is not null then
    update inquiries set status = 'invited' where id = p_inquiry;
  end if;
  return v;
end $$;
revoke all on function issue_invite_code(uuid, text, text) from public, anon;
grant execute on function issue_invite_code(uuid, text, text) to authenticated;

-- ---------- security hardening (Supabase security advisor 권고, 2026-09-22)
alter view session_availability set (security_invoker = true);
alter function reserve_seat(uuid, uuid, int) set search_path = public;
alter function expire_pending_bookings() set search_path = public;
alter function is_admin() set search_path = public;
alter function handle_new_user() set search_path = public;
-- SECURITY DEFINER 함수는 서버(service role)·트리거에서만 호출한다.
revoke execute on function reserve_seat(uuid, uuid, int) from anon, authenticated, public;
revoke execute on function handle_new_user() from anon, authenticated, public;
revoke execute on function expire_pending_bookings() from anon, authenticated, public;

-- ---------- M5: Storage 버킷 (프로그램 이미지, 공개 읽기 · 관리자 쓰기)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('programs', 'programs', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true;
create policy "programs public read" on storage.objects for select using (bucket_id = 'programs');
create policy "programs admin insert" on storage.objects for insert with check (bucket_id = 'programs' and public.is_admin());
create policy "programs admin update" on storage.objects for update using (bucket_id = 'programs' and public.is_admin());
create policy "programs admin delete" on storage.objects for delete using (bucket_id = 'programs' and public.is_admin());

-- ---------- M5: 잔여석 함수 (회원은 bookings RLS 때문에 남의 예약을 못 보므로 SECURITY DEFINER 로 계산)
create or replace function session_remaining(p_session uuid)
returns int language sql stable security definer set search_path = public as $$
  select s.capacity - coalesce((
    select sum(b.qty)::int from bookings b
    where b.session_id = s.id
      and (b.status in ('confirmed','attended') or (b.status = 'pending' and b.expires_at > now()))
  ), 0)
  from sessions s where s.id = p_session;
$$;
grant execute on function session_remaining(uuid) to anon, authenticated;
drop view if exists session_availability;
create view session_availability with (security_invoker = true) as
select s.id as session_id, s.program_id, s.starts_at, s.capacity, session_remaining(s.id) as remaining
from sessions s;
grant select on session_availability to anon, authenticated;

-- programs.updated_at 자동 갱신
create or replace function set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger programs_updated_at before update on programs for each row execute function set_updated_at();

-- ---------- M6: pg_cron — 15분 미결제 예약 만료 (Dashboard → Database → Extensions → pg_cron 켠 뒤 실행)
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
select cron.schedule('expire-bookings', '*/5 * * * *', $$select public.expire_pending_bookings()$$);

-- ---------- M6: 로그인 회원 본인 예약 (reserve_seat 래퍼, member_id = auth.uid())
-- 같은 회차에 이미 유효한 예약(확정 또는 미만료 pending)이 있으면 그 예약을 돌려준다(중복 홀드 방지).
create or replace function book_session(p_session uuid)
returns bookings language plpgsql security definer set search_path = public as $$
declare m members; b bookings; p programs; s sessions;
begin
  select * into m from members where id = auth.uid();
  if m is null then raise exception 'NOT_MEMBER'; end if;
  if m.status <> 'active' then raise exception 'MEMBER_INACTIVE'; end if;
  if m.invite_code_id is null then raise exception 'NOT_INVITED'; end if;
  select * into s from sessions where id = p_session;
  if s is null then raise exception 'SESSION_NOT_FOUND'; end if;
  select * into p from programs where id = s.program_id;
  if p is null or not coalesce(p.is_published, false) then raise exception 'PROGRAM_UNPUBLISHED'; end if;
  if s.starts_at < now() then raise exception 'SESSION_PAST'; end if;
  select * into b from bookings
    where member_id = m.id and session_id = p_session
      and (status in ('confirmed','attended') or (status = 'pending' and expires_at > now()))
    order by created_at desc limit 1;
  if b is not null then return b; end if;
  b := reserve_seat(p_session, m.id, 1);
  return b;
end $$;
revoke all on function book_session(uuid) from public, anon;
grant execute on function book_session(uuid) to authenticated;

-- ---------- M9: 사이트 콘텐츠 관리(CMS) + 접속 통계 + 관리자 활동 로그
create table site_content (
  id text primary key,                        -- 'home.hero' 등 (lib/cms/schema.ts)
  page text not null,                         -- global | home | pricing | benefits | legal
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  updated_by uuid references members(id)
);
create table site_content_history (
  id bigserial primary key,
  content_id text not null,
  data jsonb not null,
  saved_at timestamptz default now(),
  saved_by uuid references members(id)
);
create index on site_content_history(content_id, saved_at desc);
create table page_views (
  id bigserial primary key,
  ts timestamptz not null default now(),
  path text not null,
  referrer text, ref_host text,
  utm_source text, utm_medium text, utm_campaign text,
  visitor_id text, member_id uuid,
  device text, country text
);
create index on page_views(ts);
create index on page_views(path, ts);
create table admin_logs (
  id bigserial primary key,
  ts timestamptz not null default now(),
  admin_id uuid references members(id),
  action text not null,
  target text,
  detail jsonb
);
create index on admin_logs(ts desc);
alter table site_content enable row level security;
alter table site_content_history enable row level security;
alter table page_views enable row level security;
alter table admin_logs enable row level security;
create policy "site content public read" on site_content for select using (true);
create policy "site content admin write" on site_content for all using (is_admin());
create policy "site history admin" on site_content_history for all using (is_admin());
create policy "page views admin read" on page_views for select using (is_admin());   -- insert 는 서버(service role)
create policy "admin logs admin" on admin_logs for all using (is_admin());

create or replace function stats_page_views(p_from timestamptz, p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'pv', pv, 'uv', uv) order by d), '[]') from (
        select to_char(ts at time zone 'Asia/Seoul', 'YYYY-MM-DD') d, count(*) pv, count(distinct visitor_id) uv
        from page_views where ts >= p_from and ts < p_to group by 1) x),
    'paths', (select coalesce(jsonb_agg(jsonb_build_object('path', path, 'pv', pv, 'uv', uv) order by pv desc), '[]') from (
        select path, count(*) pv, count(distinct visitor_id) uv from page_views where ts >= p_from and ts < p_to group by 1 order by 2 desc limit 15) x),
    'referrers', (select coalesce(jsonb_agg(jsonb_build_object('host', host, 'pv', pv) order by pv desc), '[]') from (
        select coalesce(nullif(ref_host, ''), '(직접 접속)') host, count(*) pv from page_views where ts >= p_from and ts < p_to group by 1 order by 2 desc limit 10) x),
    'devices', (select coalesce(jsonb_agg(jsonb_build_object('device', device, 'pv', pv)), '[]') from (
        select coalesce(device, 'unknown') device, count(*) pv from page_views where ts >= p_from and ts < p_to group by 1) x),
    'countries', (select coalesce(jsonb_agg(jsonb_build_object('country', country, 'pv', pv) order by pv desc), '[]') from (
        select coalesce(country, '??') country, count(*) pv from page_views where ts >= p_from and ts < p_to group by 1 order by 2 desc limit 8) x),
    'totals', (select jsonb_build_object('pv', count(*), 'uv', count(distinct visitor_id), 'members', count(distinct member_id)) from page_views where ts >= p_from and ts < p_to)
  ) into r;
  return r;
end $$;
revoke all on function stats_page_views(timestamptz, timestamptz) from public, anon;
grant execute on function stats_page_views(timestamptz, timestamptz) to authenticated;

-- 사이트 이미지 버킷 (로고·섹션 사진)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site', 'site', true, 10485760, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do update set public = true;
create policy "site public read" on storage.objects for select using (bucket_id = 'site');
create policy "site admin insert" on storage.objects for insert with check (bucket_id = 'site' and public.is_admin());
create policy "site admin update" on storage.objects for update using (bucket_id = 'site' and public.is_admin());
create policy "site admin delete" on storage.objects for delete using (bucket_id = 'site' and public.is_admin());

-- ---------- M10: 일반 설정 — 로그인 연속 실패 잠금 (서버 service role 전용, 정책 없음)
create table login_attempts (
  key text primary key,                       -- email:… 또는 ip:…
  fails int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table login_attempts enable row level security;
-- 일반 설정 값은 site_content 의 'settings.*' 문서에 저장 (lib/settings/schema.ts)

-- ---------- M11: SEO · GEO + 소식 게시판
-- SEO 설정 값은 site_content 의 'seo.*' 문서에 저장 (lib/seo/schema.ts). FAQ 는 'home.faq'
create table posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                  -- /news/<slug>
  title text not null,
  category text not null default '소식',      -- 소식 | 프로그램 | 행사 후기 | 공지
  summary text,
  body text not null default '',              -- 간단 마크다운 (components/Markdown.tsx)
  cover_image text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references members(id)
);
create index posts_published_idx on posts(published, published_at desc);
create trigger posts_updated_at before update on posts for each row execute function set_updated_at();
alter table posts enable row level security;
create policy "posts public read" on posts for select using (published = true or is_admin());
create policy "posts admin write" on posts for all using (is_admin()) with check (is_admin());

-- ---------- M12: 관리자 관리 — 주관리자(owner)가 부관리자(admin) 초대. 링크 토큰은 해시만 저장, 48시간, 1회용
-- (members.role 에 'owner' 추가, members.last_login_at, is_admin/is_owner, handle_new_user 의 admin_invite 경로는 위에 반영)
create table admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null default '',
  role member_role not null default 'admin',
  token_hash text not null unique,
  invited_by uuid references members(id),
  expires_at timestamptz not null default now() + interval '48 hours',
  used_at timestamptz,
  used_by uuid,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index admin_invites_email_idx on admin_invites(email);
alter table admin_invites enable row level security;
create policy "admin invites owner" on admin_invites for all using (is_owner()) with check (is_owner());
-- 주관리자 지정: update members set role = 'owner' where lower(email) = '<주관리자 이메일>';
