-- Create the product-files storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-files', 'product-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for product-files bucket
CREATE POLICY "Users can view product files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-files');

CREATE POLICY "Authenticated users can upload product files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-files' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their product files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-files' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their product files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-files' 
  AND auth.uid() IS NOT NULL
);