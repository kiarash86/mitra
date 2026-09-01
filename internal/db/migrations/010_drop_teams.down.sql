CREATE TABLE
    teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        name VARCHAR(255) NOT NULL,
        organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        deleted_at TIMESTAMPTZ
    );

CREATE TABLE
    team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        team_id UUID NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        UNIQUE (team_id, user_id)
    );

ALTER TABLE tasks
ADD COLUMN assigned_to_team_id UUID REFERENCES teams (id) ON DELETE SET NULL;

CREATE INDEX idx_tasks_assigned_to_team_id ON tasks (assigned_to_team_id);