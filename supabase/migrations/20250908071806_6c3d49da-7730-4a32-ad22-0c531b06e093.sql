-- Phase 1: Corriger les politiques RLS pour audit_logs
-- Le problème: RLS empêche l'insertion des logs de monitoring

-- Vérifier et ajuster les politiques RLS pour permettre aux utilisateurs authentifiés 
-- d'insérer leurs propres logs d'audit
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON audit_logs;

CREATE POLICY "Users can insert their own audit logs"
ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permettre aussi la lecture des propres logs pour le monitoring
DROP POLICY IF EXISTS "Users can read their own audit logs" ON audit_logs;

CREATE POLICY "Users can read their own audit logs"  
ON audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Correction pour les logs système/anonymes (analytics)
DROP POLICY IF EXISTS "Allow system audit logs" ON audit_logs;

CREATE POLICY "Allow system audit logs"
ON audit_logs  
FOR INSERT
TO authenticated
WITH CHECK (
  -- Permettre les logs système avec resource_type = 'user_event'
  resource_type = 'user_event' OR
  -- Permettre les logs avec user_id de l'utilisateur connecté
  auth.uid() = user_id
);