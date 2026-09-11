-- Apply once to a new Supabase project. No browser role can modify commerce state.
create table public.user_roles(user_id uuid primary key references auth.users(id) on delete cascade,role text not null check(role in ('admin','editor')));
create table public.products(id text primary key,sku text unique not null,name text not null,category text not null,kind text not null check(kind in ('physical','audio','ebook','course')),price integer not null check(price>=0),stock integer not null default 0 check(stock>=0),description text not null default '',image text not null default '',gallery jsonb not null default '[]',video text,tag text,published boolean not null default false,purchasable boolean not null default false,created_at timestamptz not null default now());
create table public.digital_assets(product_id text primary key references public.products(id),path text not null);
create table public.orders(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),status text not null default 'pending' check(status in ('pending','capturing','paid','cancelled','refund_review')),total integer not null check(total>=0),shipping integer not null default 0,physical boolean not null default false,items jsonb not null,paypal_id text unique,capture_id text unique,shipping_address jsonb,created_at timestamptz not null default now(),paid_at timestamptz);
create index orders_user_idx on public.orders(user_id,created_at desc);
create index orders_status_idx on public.orders(status,created_at);
create table public.entitlements(order_id uuid references public.orders(id),product_id text references public.products(id),user_id uuid not null references auth.users(id),active boolean not null default true,primary key(order_id,product_id));
create index entitlement_access_idx on public.entitlements(user_id,product_id,active);
create table public.inventory_movements(id bigint generated always as identity primary key,product_id text not null references public.products(id),quantity integer not null,reason text not null,actor uuid,order_id uuid references public.orders(id),created_at timestamptz not null default now());
create table public.webhook_events(id text primary key,type text not null,processed boolean not null default false,created_at timestamptz not null default now());
create table public.outbox_jobs(id bigint generated always as identity primary key,order_id uuid references public.orders(id),kind text not null,status text not null default 'pending',created_at timestamptz not null default now(),unique(order_id,kind));
alter table public.user_roles enable row level security;
alter table public.products enable row level security;
alter table public.digital_assets enable row level security;
alter table public.orders enable row level security;
alter table public.entitlements enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.webhook_events enable row level security;
alter table public.outbox_jobs enable row level security;
create policy published_catalog on public.products for select using(published);
create policy own_orders on public.orders for select to authenticated using(user_id=auth.uid());
create policy own_entitlements on public.entitlements for select to authenticated using(user_id=auth.uid());
create policy own_role on public.user_roles for select to authenticated using(user_id=auth.uid());
revoke all on public.products,public.orders,public.entitlements,public.user_roles,public.digital_assets,public.inventory_movements,public.webhook_events,public.outbox_jobs from anon,authenticated;
grant select on public.products to anon,authenticated;
grant select on public.orders,public.entitlements,public.user_roles to authenticated;

create function public.reserve_order(p_user_id uuid,p_items jsonb,p_shipping integer) returns jsonb language plpgsql security definer set search_path=public as $$
declare item jsonb; p products; n integer; amount integer:=0; physical boolean:=false; snapshot jsonb:='[]'; new_id uuid;
begin
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>30 or p_shipping<0 then raise exception 'Invalid cart'; end if;
 if (select count(*) from jsonb_array_elements(p_items))<>(select count(distinct v->>'id') from jsonb_array_elements(p_items) v) then raise exception 'Duplicate item'; end if;
 -- Stable locking order prevents deadlocks between competing baskets.
 for item in select value from jsonb_array_elements(p_items) order by value->>'id' loop
  select * into p from products where id=item->>'id' and published and purchasable for update;
  if not found then raise exception 'Product unavailable'; end if;
  n:=(item->>'quantity')::integer;
  if n<1 or n>20 or p.stock<n then raise exception 'Insufficient inventory'; end if;
  if p.kind<>'physical' and n<>1 then raise exception 'Digital quantity must equal one'; end if;
  if p.kind in ('audio','ebook') and not exists(select 1 from digital_assets where product_id=p.id) then raise exception 'Digital file unavailable'; end if;
  if p.kind='course' then raise exception 'Course enrollment requires a confirmed schedule'; end if;
  if p.kind='physical' then update products set stock=stock-n where id=p.id; physical:=true; end if;
  amount:=amount+p.price*n;
  snapshot:=snapshot||jsonb_build_array(jsonb_build_object('id',p.id,'sku',p.sku,'name',p.name,'quantity',n,'price',p.price,'kind',p.kind));
 end loop;
 if not physical then p_shipping:=0; end if;
 insert into orders(user_id,total,shipping,physical,items) values(p_user_id,amount+p_shipping,p_shipping,physical,snapshot) returning id into new_id;
 for item in select value from jsonb_array_elements(snapshot) loop
  if item->>'kind'='physical' then insert into inventory_movements(product_id,quantity,reason,order_id) values(item->>'id',-(item->>'quantity')::integer,'reserved',new_id); end if;
 end loop;
 return jsonb_build_object('id',new_id,'total',amount+p_shipping,'physical',physical);
end $$;

create function public.complete_order(p_order_id uuid,p_capture_id text,p_shipping jsonb) returns void language plpgsql security definer set search_path=public as $$
declare o orders; item jsonb;
begin
 select * into o from orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if o.status='paid' then
  if o.capture_id<>p_capture_id then raise exception 'Capture mismatch'; end if;
  return;
 end if;
 if o.status not in ('pending','capturing') then raise exception 'Order requires review'; end if;
 if o.physical and (p_shipping is null or p_shipping->'address'->>'country_code'<>'MX') then raise exception 'Unsupported shipping destination'; end if;
 update orders set status='paid',capture_id=p_capture_id,paid_at=now(),shipping_address=p_shipping where id=p_order_id;
 for item in select value from jsonb_array_elements(o.items) loop
  if item->>'kind'<>'physical' then insert into entitlements(order_id,product_id,user_id) values(o.id,item->>'id',o.user_id) on conflict do nothing; end if;
 end loop;
 insert into outbox_jobs(order_id,kind) values(o.id,'order_confirmation') on conflict do nothing;
end $$;

create function public.release_order(p_order_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare o orders; item jsonb;
begin
 select * into o from orders where id=p_order_id for update;
 if o.status='cancelled' then return; end if;
 if o.status not in ('pending','capturing') then raise exception 'Cannot release captured order'; end if;
 -- Call only after PayPal confirms VOIDED or an operator confirms no external order exists.
 for item in select value from jsonb_array_elements(o.items) order by value->>'id' loop
  if item->>'kind'='physical' then
   update products set stock=stock+(item->>'quantity')::integer where id=item->>'id';
   insert into inventory_movements(product_id,quantity,reason,order_id) values(item->>'id',(item->>'quantity')::integer,'released',o.id);
  end if;
 end loop;
 update orders set status='cancelled' where id=o.id;
end $$;

create function public.adjust_inventory(p_rows jsonb,p_actor uuid) returns void language plpgsql security definer set search_path=public as $$
declare r jsonb;p products;
begin
 if not exists(select 1 from user_roles where user_id=p_actor and role='admin') then raise exception 'Admin required';end if;
 for r in select value from jsonb_array_elements(p_rows) order by value->>'sku' loop
  select * into p from products where sku=r->>'sku' for update;
  if not found then raise exception 'Unknown SKU'; end if;
  if p.stock+(r->>'stock')::integer<0 then raise exception 'Adjustment exceeds available stock';end if;
  update products set stock=stock+(r->>'stock')::integer,price=coalesce((r->>'price')::integer,price) where id=p.id;
  insert into inventory_movements(product_id,quantity,reason,actor) values(p.id,(r->>'stock')::integer,'admin_adjustment',p_actor);
 end loop;
end $$;

create function public.suspend_refunded_order(p_capture_id text) returns void language plpgsql security definer set search_path=public as $$
declare oid uuid;
begin
 update orders set status='refund_review' where capture_id=p_capture_id returning id into oid;
 update entitlements set active=false where order_id=oid;
 -- Partial refunds require staff to restore unaffected line entitlements. Physical stock is not automatically returned.
end $$;
revoke all on function public.reserve_order(uuid,jsonb,integer),public.complete_order(uuid,text,jsonb),public.release_order(uuid),public.adjust_inventory(jsonb,uuid),public.suspend_refunded_order(text) from public,anon,authenticated;
grant execute on function public.reserve_order(uuid,jsonb,integer),public.complete_order(uuid,text,jsonb),public.release_order(uuid),public.adjust_inventory(jsonb,uuid),public.suspend_refunded_order(text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('catalog','catalog',true,52428800,array['image/jpeg','image/png','image/webp','video/mp4']),
 ('premium','premium',false,52428800,array['audio/mpeg','audio/wav','application/pdf']) on conflict(id) do nothing;
-- No client policy grants access to premium files; the server signs URLs after checking entitlements.
