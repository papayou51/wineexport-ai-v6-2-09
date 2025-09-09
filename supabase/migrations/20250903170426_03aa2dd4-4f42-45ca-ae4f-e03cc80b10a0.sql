-- Update project_type enum to include all needed types
DROP TYPE IF EXISTS project_type;
CREATE TYPE project_type AS ENUM ('market_study', 'regulatory_analysis', 'lead_generation', 'marketing_intelligence', 'full_analysis');

-- Update project_status enum to match expected values
DROP TYPE IF EXISTS project_status; 
CREATE TYPE project_status AS ENUM ('draft', 'running', 'completed', 'failed');

-- Update analysis_type enum to include all needed types
DROP TYPE IF EXISTS analysis_type;
CREATE TYPE analysis_type AS ENUM ('market_study', 'regulatory_analysis', 'lead_generation', 'marketing_intelligence');

-- Update lead_type enum to include all needed types  
DROP TYPE IF EXISTS lead_type;
CREATE TYPE lead_type AS ENUM ('importer', 'distributor', 'retailer', 'restaurant', 'hotel');