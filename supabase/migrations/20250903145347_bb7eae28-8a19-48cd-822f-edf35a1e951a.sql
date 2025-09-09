-- Create storage bucket for product files
INSERT INTO storage.buckets (id, name, public) VALUES ('product-files', 'product-files', false);

-- Storage policies for product files
CREATE POLICY "Users can upload their organization's product files"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text 
    FROM organizations o
    WHERE has_organization_role(o.id, 'member'::app_role)
  )
);

CREATE POLICY "Users can view their organization's product files"
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'product-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text 
    FROM organizations o
    WHERE has_organization_role(o.id, 'member'::app_role)
  )
);

CREATE POLICY "Users can update their organization's product files"
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text 
    FROM organizations o
    WHERE has_organization_role(o.id, 'member'::app_role)
  )
);

CREATE POLICY "Users can delete their organization's product files"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text 
    FROM organizations o
    WHERE has_organization_role(o.id, 'member'::app_role)
  )
);