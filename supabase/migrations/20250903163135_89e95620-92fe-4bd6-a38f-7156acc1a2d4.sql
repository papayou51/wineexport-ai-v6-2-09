-- Create organization and user management trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_name text;
BEGIN
  -- Get organization name from user metadata, default to email if not provided
  org_name := COALESCE(
    NEW.raw_user_meta_data ->> 'organization_name',
    split_part(NEW.email, '@', 1) || ' Organization'
  );

  -- Create organization
  INSERT INTO public.organizations (name, slug, description)
  VALUES (
    org_name,
    lower(replace(replace(org_name, ' ', '-'), '.', '-')),
    'Organisation créée automatiquement'
  )
  RETURNING id INTO new_org_id;

  -- Add user as owner of the organization
  INSERT INTO public.user_organization_roles (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');

  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();