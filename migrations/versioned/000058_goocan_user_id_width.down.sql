-- Rollback: 000058_goocan_user_id_width

ALTER TABLE IF EXISTS auth_tokens DROP CONSTRAINT IF EXISTS fk_auth_tokens_user;

ALTER TABLE IF EXISTS agent_shares ALTER COLUMN shared_by_user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS kb_shares ALTER COLUMN shared_by_user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS organization_join_requests ALTER COLUMN reviewed_by TYPE VARCHAR(36);
ALTER TABLE IF EXISTS organization_join_requests ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS organization_tenant_members ALTER COLUMN representative_user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS organization_members ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS organizations ALTER COLUMN owner_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS tenant_invitations ALTER COLUMN invited_by TYPE VARCHAR(36);
ALTER TABLE IF EXISTS tenant_invitations ALTER COLUMN invitee_user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS user_kb_pins ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS user_resource_favorites ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS audit_logs ALTER COLUMN target_user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS audit_logs ALTER COLUMN actor_user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS custom_agents ALTER COLUMN created_by TYPE VARCHAR(36);
ALTER TABLE IF EXISTS knowledge_bases ALTER COLUMN creator_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS tenant_members ALTER COLUMN invited_by TYPE VARCHAR(36);
ALTER TABLE IF EXISTS tenant_members ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS sessions ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS auth_tokens ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE IF EXISTS users ALTER COLUMN id TYPE VARCHAR(36);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_auth_tokens_user') THEN
        ALTER TABLE auth_tokens ADD CONSTRAINT fk_auth_tokens_user
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;
