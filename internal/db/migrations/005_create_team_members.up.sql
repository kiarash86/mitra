CREATE TABLE
    team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        team_id UUID NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        UNIQUE (team_id, user_id)
    );