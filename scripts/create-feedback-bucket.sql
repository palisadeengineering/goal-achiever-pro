-- Create the feedback-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-screenshots',
  'feedback-screenshots',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload screenshots
CREATE POLICY "Allow authenticated uploads to feedback-screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feedback-screenshots');

-- Allow public read access to screenshots
CREATE POLICY "Allow public read access to feedback-screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'feedback-screenshots');

-- Allow service role to manage all objects
CREATE POLICY "Allow service role full access to feedback-screenshots"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'feedback-screenshots')
WITH CHECK (bucket_id = 'feedback-screenshots');
