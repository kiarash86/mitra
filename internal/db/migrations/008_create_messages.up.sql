CREATE TABLE
    messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        deleted_at TIMESTAMPTZ
    );

CREATE INDEX idx_messages_project_id_created_at ON messages (project_id, created_at);
