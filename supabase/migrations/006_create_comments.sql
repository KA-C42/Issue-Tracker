CREATE TABLE IF NOT EXISTS comments (

    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    author_id uuid REFERENCES users (id) NOT NULL,

    issue_id uuid REFERENCES issues (id) ON DELETE CASCADE NOT NULL,

    comment text NOT NULL,

    modified_at timestamptz NOT NULL DEFAULT now(),

    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_by_issue_id ON comments (issue_id);

CREATE OR REPLACE TRIGGER comment_modified 
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_modified_at();

