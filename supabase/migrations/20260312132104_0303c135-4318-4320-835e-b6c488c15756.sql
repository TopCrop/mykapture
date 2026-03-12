ALTER TABLE public.leads DROP CONSTRAINT leads_event_id_fkey;
ALTER TABLE public.leads ADD CONSTRAINT leads_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;