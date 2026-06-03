-- Migration: 000059_builtin_agent_datagoocan_prompts
-- Refresh persisted built-in agent prompts after the public product name was
-- changed from WeKnora to DataGoocan. User-created agents are intentionally
-- untouched because their prompts may be user-authored content.

DO $$ BEGIN RAISE NOTICE '[Migration 000059] Updating built-in agent prompts to DataGoocan branding'; END $$;

UPDATE custom_agents
SET
    config = jsonb_set(
        config,
        '{system_prompt}',
        to_jsonb(
            replace(
                replace(
                    replace(
                        replace(config->>'system_prompt', ' developed by Tencent,', ''),
                        ' developed by Tencent.',
                        '.'
                    ),
                    ' developed by Tencent',
                    ''
                ),
                'WeKnora',
                'DataGoocan'
            )
        ),
        true
    ),
    updated_at = NOW()
WHERE
    is_builtin = TRUE
    AND deleted_at IS NULL
    AND config ? 'system_prompt'
    AND (
        config->>'system_prompt' LIKE '%WeKnora%'
        OR config->>'system_prompt' LIKE '%developed by Tencent%'
    );

DO $$ BEGIN RAISE NOTICE '[Migration 000059] Built-in agent prompt branding update complete'; END $$;
