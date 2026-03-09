ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
UPDATE public.organizations SET status = 'approved' WHERE status = 'pending';