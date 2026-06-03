-- Rollback for 000059_builtin_agent_datagoocan_prompts.
-- No-op by design: reverting branding in persisted prompts is not safe because
-- administrators may edit built-in prompts after the migration.

DO $$ BEGIN RAISE NOTICE '[Migration 000059] No-op rollback for built-in agent prompt branding'; END $$;
