ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_captured_by_fkey;
ALTER TABLE public.leads
ADD CONSTRAINT leads_captured_by_fkey
FOREIGN KEY (captured_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;