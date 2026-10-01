-- ==============================================================================
-- OpenedShelf Cloudflare D1 Moderation & Governance Database Schema
-- Dedicated strictly to community proposals, moderation workflows, and Library Council voting.
--
-- ISOLATION GUARANTEE:
-- This database is completely decoupled from the read-only catalog search index.
-- Catalog queries run against immutable SQLite artifacts on Cloudflare R2 via
-- the search query service. D1 handles ONLY transactional moderation data.
-- ==============================================================================

-- 1. Pending_Tags: Incoming community tag proposals
CREATE TABLE IF NOT EXISTS Pending_Tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id TEXT NOT NULL,
    work_title TEXT,
    work_isbn TEXT,
    proposed_tag_name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('thematic', 'genre_identity', 'genre_trope', 'audience', 'language')),
    justification TEXT NOT NULL,
    submitted_by TEXT DEFAULT 'anonymous',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disputed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_tags_status ON Pending_Tags(status);
CREATE INDEX IF NOT EXISTS idx_pending_tags_work_id ON Pending_Tags(work_id);
CREATE INDEX IF NOT EXISTS idx_pending_tags_proposed_name ON Pending_Tags(proposed_tag_name);

-- 2. Moderation_Log: Comprehensive audit trail of all moderation actions
CREATE TABLE IF NOT EXISTS Moderation_Log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER REFERENCES Pending_Tags(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'disputed', 'promoted')),
    moderator_id TEXT NOT NULL,
    moderator_role TEXT NOT NULL DEFAULT 'librarian' CHECK (moderator_role IN ('librarian', 'council_lead', 'admin')),
    written_rationale TEXT NOT NULL,
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modlog_proposal_id ON Moderation_Log(proposal_id);
CREATE INDEX IF NOT EXISTS idx_modlog_action ON Moderation_Log(action);
CREATE INDEX IF NOT EXISTS idx_modlog_timestamp ON Moderation_Log(action_timestamp);

-- 3. Council_Votes: Weekly voting cycle records for Thematic Tag promotions & vetoes
CREATE TABLE IF NOT EXISTS Council_Votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER REFERENCES Pending_Tags(id) ON DELETE CASCADE,
    cycle_week TEXT NOT NULL, -- Format: YYYY-Www (e.g., '2026-W40')
    tag_name TEXT NOT NULL,
    council_member_id TEXT NOT NULL,
    vote TEXT NOT NULL CHECK (vote IN ('yes', 'no', 'abstain', 'veto')),
    rationale TEXT, -- Strictly required if vote = 'veto' per Library Council transparency charter
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cycle_week, proposal_id, council_member_id)
);

CREATE INDEX IF NOT EXISTS idx_council_votes_cycle ON Council_Votes(cycle_week);
CREATE INDEX IF NOT EXISTS idx_council_votes_tag ON Council_Votes(tag_name);
CREATE INDEX IF NOT EXISTS idx_council_votes_proposal ON Council_Votes(proposal_id);
