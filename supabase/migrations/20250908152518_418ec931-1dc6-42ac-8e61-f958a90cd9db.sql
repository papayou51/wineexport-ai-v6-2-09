-- Create table for storing product specifications from AI extraction
CREATE TABLE IF NOT EXISTS public.product_specs (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID NOT NULL,
  filename TEXT NOT NULL,
  spec_json JSONB NOT NULL,
  quality_score INTEGER,
  providers JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for organization queries
CREATE INDEX IF NOT EXISTS product_specs_org_idx ON public.product_specs(organization_id);

-- Enable RLS
ALTER TABLE public.product_specs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage organization product specs"
ON public.product_specs
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.user_organization_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  )
);

CREATE POLICY "Users can view organization product specs"
ON public.product_specs
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.user_organization_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  )
);