-- Create conversation_history table
CREATE TABLE IF NOT EXISTS conversation_history (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_message TEXT NOT NULL,
    npc_response TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Create learned_concepts table
CREATE TABLE IF NOT EXISTS learned_concepts (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    concept TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, concept)
);
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversation_history_session_id ON conversation_history(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_timestamp ON conversation_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_learned_concepts_session_id ON learned_concepts(session_id);
CREATE INDEX IF NOT EXISTS idx_learned_concepts_concept ON learned_concepts(concept);