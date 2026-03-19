CREATE TABLE IF NOT EXISTS project_contributors (

    user_id uuid REFERENCES users (id) ON DELETE CASCADE,

    project_id uuid REFERENCES projects (id) ON DELETE CASCADE,

    joined_at timestamptz NOT NULL DEFAULT now(),
    
    PRIMARY KEY (user_id, project_id)
);