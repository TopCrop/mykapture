ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS proxycurl_api_key TEXT;
ALTER TABLE public.org_features ADD COLUMN IF NOT EXISTS linkedin_scanner_enabled BOOLEAN NOT NULL DEFAULT FALSE;