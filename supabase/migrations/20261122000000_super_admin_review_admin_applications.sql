create or replace function public.review_admin_application(
  target_user_id uuid,
  final_decision text
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.is_super_admin() then
    raise exception 'Only the Super Admin can review administrator applications.'
      using errcode = '42501';
  end if;

  if final_decision not in ('approved', 'cancelled') then
    raise exception 'Decision must be approved or cancelled.'
      using errcode = '22023';
  end if;

  update public.profiles
     set status = case when final_decision = 'approved'
                       then 'approved'::public.account_status
                       else 'cancelled'::public.account_status end,
         admin_level = case when final_decision = 'approved' then 'standard' else null end,
         updated_at = now()
   where id = target_user_id
     and role = 'admin'::public.urwa_role
     and status = 'pending'::public.account_status
     and id <> auth.uid();

  if not found then
    raise exception 'Pending administrator application not found.'
      using errcode = 'P0002';
  end if;
end;
$function$;

revoke all on function public.review_admin_application(uuid, text) from public;
grant execute on function public.review_admin_application(uuid, text) to authenticated;
