
-- Create follow_up_bookings table to track scheduled follow-ups with future calendar integration support
CREATE TABLE public.follow_up_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  booked_by UUID NOT NULL,
  follow_up_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  meeting_type TEXT NOT NULL DEFAULT 'call',
  notes TEXT,
  calendar_provider TEXT, -- 'google', 'microsoft', 'apple', null for in-app only
  external_event_id TEXT, -- ID from external calendar provider
  external_event_url TEXT, -- Link to external calendar event
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.follow_up_bookings ENABLE ROW LEVEL SECURITY;

-- RLS: users can create their own bookings
CREATE POLICY "Users can create bookings" ON public.follow_up_bookings
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = booked_by);

-- RLS: users can view all bookings
CREATE POLICY "Users can view all bookings" ON public.follow_up_bookings
FOR SELECT TO authenticated
USING (true);

-- RLS: users can update their own bookings, admins/managers can update any
CREATE POLICY "Users can update own bookings" ON public.follow_up_bookings
FOR UPDATE TO authenticated
USING (auth.uid() = booked_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Add follow_up_email_sent to leads table to track email status
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS follow_up_email_sent BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS follow_up_email_sent_at TIMESTAMPTZ;

-- Updated_at trigger for follow_up_bookings
CREATE TRIGGER update_follow_up_bookings_updated_at
  BEFORE UPDATE ON public.follow_up_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
