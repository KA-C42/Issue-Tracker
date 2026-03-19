CREATE TABLE IF NOT EXISTS issues (
    
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    creator_id uuid REFERENCES users (id) NOT NULL,

    project_id uuid REFERENCES projects (id) ON DELETE CASCADE NOT NULL,

    name text NOT NULL CHECK (char_length(name) BETWEEN 1 and 128),

    issue_code text NOT NULL,

    details text,

    status text NOT NULL,

    CHECK (status IN ('BACKLOG', 'IN_PROGRESS', 'DONE')),

    assignee_id uuid REFERENCES users (id),

    status_changed_at timestamptz NOT NULL DEFAULT now(),

    modified_at timestamptz NOT NULL DEFAULT now(),

    created_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE (project_id, issue_code)

);

CREATE INDEX IF NOT EXISTS issues_by_status ON issues (
    project_id,
    status
);

CREATE OR REPLACE FUNCTION update_status_at() 
    RETURNS trigger AS $$
    BEGIN
        new.status_changed_at = now();
    RETURN new;
    END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE TRIGGER issue_modified 
    BEFORE UPDATE OF name, issue_code, details ON issues
    FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE OR REPLACE TRIGGER issue_status_change
    BEFORE UPDATE OF status ON issues
    FOR EACH ROW EXECUTE FUNCTION update_status_at();

