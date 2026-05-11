revoke execute on function public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean, text) from public;
revoke execute on function public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean, text) from anon;
grant execute on function public.zec_search_global_leads(text, text[], text[], integer, text, boolean, boolean, boolean, boolean, text) to authenticated;
