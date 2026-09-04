CREATE TABLE IF NOT EXISTS invites (

    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    sender_id uuid REFERENCES profiles (id) NOT NULL,

    recipient_id uuid REFERENCES profiles (id) NOT NULL,

    project_id uuid REFERENCES projects (id) ON DELETE CASCADE NOT NULL,

    status text NOT NULL DEFAULT 'PENDING',

    CHECK (status in ('PENDING', 'ACCEPTED', 'REJECTED', 'REVOKED')),

    status_changed_at timestamptz NOT NULL DEFAULT now(),

    sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX one_pending_invite_per_project
ON invites (project_id, recipient_id)
WHERE status = 'PENDING';

CREATE OR REPLACE TRIGGER invite_status_change
    BEFORE UPDATE OF status ON invites
    FOR EACH ROW EXECUTE FUNCTION update_status_at();

CREATE OR REPLACE FUNCTION make_project_contributor()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO project_contributors (project_id, user_id)
        VALUES (NEW.project_id, NEW.recipient_id)
        ON CONFLICT DO NOTHING;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER invite_accepted
    AFTER UPDATE ON invites
    FOR EACH ROW
    WHEN (
        OLD.status = 'PENDING'
        AND NEW.status = 'ACCEPTED'
    )
    EXECUTE FUNCTION make_project_contributor();

CREATE OR REPLACE FUNCTION prevent_inviting_existing_member()
    RETURNS TRIGGER AS $$
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM project_contributors pc
            WHERE pc.project_id = NEW.project_id
                AND pc.user_id = NEW.recipient_id
        ) THEN
            RAISE EXCEPTION 'RECIPIENT_ALREADY_CONTRIBUTOR';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM projects p
            WHERE p.id = NEW.project_id
                AND p.creator_id = NEW.recipient_id
        ) THEN
            RAISE EXCEPTION 'RECIPIENT_OWNS_PROJECT';
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_invites
    BEFORE INSERT ON invites
    FOR EACH ROW
    EXECUTE FUNCTION prevent_inviting_existing_member();