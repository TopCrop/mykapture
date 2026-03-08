
-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', false);

-- RLS policies for voice-notes bucket
CREATE POLICY "Users can upload voice notes" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own voice notes" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins and managers can read all voice notes" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'voice-notes' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));
