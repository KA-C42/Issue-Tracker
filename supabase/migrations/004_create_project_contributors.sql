CREATE TABLE IF NOT EXISTS project_contributors (

    user_id uuid REFERENCES profiles (id) ON DELETE CASCADE,

    project_id uuid REFERENCES projects (id) ON DELETE CASCADE,

    joined_at timestamptz NOT NULL DEFAULT now(),
    
    PRIMARY KEY (user_id, project_id)
);

CREATE OR REPLACE FUNCTION add_creator_as_contributor()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_contributors (project_id, user_id)
  VALUES (NEW.id, NEW.creator_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_created
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION add_creator_as_contributor();

CREATE OR REPLACE FUNCTION prevent_owner_removal()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM projects
    WHERE id = OLD.project_id AND creator_id = OLD.user_id
  ) THEN
    RAISE EXCEPTION 'CANNOT_REMOVE_OWNER';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_owner_removal_trigger
  BEFORE DELETE ON project_contributors
  FOR EACH ROW EXECUTE FUNCTION prevent_owner_removal();