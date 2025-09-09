-- Enrichissement de la table user_sessions pour les fonctionnalités avancées
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS os_details TEXT,
ADD COLUMN IF NOT EXISTS screen_resolution TEXT,
ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS connection_type TEXT, -- 'direct', 'vpn', 'proxy', 'tor'
ADD COLUMN IF NOT EXISTS previous_ips JSONB DEFAULT '[]'::jsonb;

-- Ajouter des index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_sessions_country ON public.user_sessions(country);
CREATE INDEX IF NOT EXISTS idx_user_sessions_risk_score ON public.user_sessions(risk_score);
CREATE INDEX IF NOT EXISTS idx_user_sessions_suspicious ON public.user_sessions(is_suspicious);

-- Politique RLS pour permettre aux utilisateurs de mettre à jour leurs sessions
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Politique RLS pour permettre l'insertion (upsert) des sessions
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
CREATE POLICY "Users can insert their own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);