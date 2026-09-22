-- Payment methods admins can create/edit for members to pay via (externally handled:
-- PayNow UEN and/or an uploaded QR code image). Run this in the Supabase SQL editor.

create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  paynow_uen text,
  qr_code_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists payment_methods_is_active_idx on payment_methods (is_active);
