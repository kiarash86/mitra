CREATE TABLE
    comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        task_id UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        deleted_at TIMESTAMPTZ
    );