CREATE SCHEMA IF NOT EXISTS demo;

-- Who belongs to which workspace. needed for cleanup added later
CREATE TABLE IF NOT EXISTS demo.sandboxes (

    guest_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,

    maya_id uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,

    sam_id uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,

    jamie_id uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,

    created_at timestamptz NOT NULL DEFAULT now()

);

CREATE OR REPLACE FUNCTION seed_demo_workspace()
    RETURNS trigger AS $$
    DECLARE
        guest uuid := NEW.id;
        maya uuid := gen_random_uuid();
        sam uuid := gen_random_uuid();
        jamie uuid := gen_random_uuid();

        owned uuid := gen_random_uuid();
        contributing uuid := gen_random_uuid();
        hire_kacy uuid := gen_random_uuid();

        -- 9 issue ids, without them known there is no commenting
        issue_ids uuid[] := ARRAY(SELECT gen_random_uuid() FROM generate_series(1, 9));

        adjectives text[] := ARRAY['cool', 'sleepy', 'brave', 'tiny', 'swift', 'lucky', 'fuzzy', 'quiet', 'bold', 'sunny'];
        animals text[] := ARRAY['Cat', 'Otter', 'Fox', 'Panda', 'Koala', 'Owl', 'Moth', 'Yak', 'Lynx', 'Crab'];
        guest_name text;
        attempts int := 0;
    BEGIN
        -- 1. Teammates. Their new_user trigger rows make profiles; is_anonymous
        --    defaults to false, so this trigger doesn't fire for them.
        INSERT INTO auth.users (id, email, aud, role) VALUES
            (maya, 'maya-' || guest || '@demo.invalid', 'authenticated', 'authenticated'),
            (sam, 'sam-' || guest || '@demo.invalid', 'authenticated', 'authenticated'),
            (jamie, 'jamie-' || guest || '@demo.invalid', 'authenticated', 'authenticated');

        -- 2. Readable names, retried on collision. The unique constraint on
        --    profiles.username guarantees uniqueness.
        LOOP
            attempts := attempts + 1;
            guest_name := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
                       || animals[1 + floor(random() * array_length(animals, 1))::int]
                       || (10 + floor(random() * 90)::int);
            BEGIN
                UPDATE profiles SET username = guest_name WHERE id = guest;
                UPDATE profiles SET username = 'maya_' || guest_name WHERE id = maya;
                UPDATE profiles SET username = 'sam_' || guest_name WHERE id = sam;
                UPDATE profiles SET username = 'jamie_' || guest_name WHERE id = jamie;
                EXIT;
            EXCEPTION WHEN unique_violation THEN
                -- after 20 misses, keep the default user_... names
                EXIT WHEN attempts >= 20;
            END;
        END LOOP;

        INSERT INTO demo.sandboxes (guest_id, maya_id, sam_id, jamie_id) VALUES (guest, maya, sam, jamie);

        -- 3. Projects
        INSERT INTO projects (id, creator_id, title, code, description, created_at) VALUES
            (owned, guest, 'Portfolio Website', 'SITE', 'Oops, guess you kinda rushed this description. Good thing you can edit it!', now() - interval '21 days'),
            (contributing, maya, 'Mobile App Launch', 'LNCH', 'Final steps before launching the mobile platform of our service! This description is so very descriptive and leaves absolutely zero questions about what this project is (it is filler).', now() - interval '30 days'),
            (hire_kacy, sam, 'Hire Kacy', 'HIRE', 'Looking for a dedicated software engineer to grow with your company? Look no further! This KA-C42 (also known as Kacy) unit comes with years of software engineering training, proven self-learning capabilities, a hunger to solve problems that help people, and even her own Claude subscription! Look no further for all your [entry-level] software development needs!', now() - interval '7 days');

        -- change creators joined_at to match the falsified created_at
        UPDATE project_contributors pc
            SET joined_at = p.created_at
            FROM projects p
            WHERE pc.project_id = p.id
            AND pc.user_id = p.creator_id
            AND p.id IN (owned, contributing, hire_kacy);

        -- 4. Other members
        INSERT INTO project_contributors (project_id, user_id, joined_at) VALUES
            (owned, sam, now() - interval '20 days'),
            (contributing, guest, now() - interval '25 days'),
            (contributing, sam, now() - interval '28 days'),
            (hire_kacy, maya, now() - interval '6 days');

        -- 5. Issues
        INSERT INTO issues (id, project_id, creator_id, title, details, status, assignee_id, created_at, status_changed_at, modified_at) VALUES
            (issue_ids[1], owned, guest, 'Set up CI for lint and tests', 'Run ESLint and Vitest on every push.', 'DONE', guest, now() - interval '20 days', now() - interval '4 days 1 hour', now() - interval '20 days'),
            (issue_ids[2], owned, guest, 'Add a dark mode toggle', 'Default to the system preference.', 'BACKLOG', guest, now() - interval '12 days', now() - interval '12 days', now() - interval '12 days'),
            (issue_ids[3], owned, sam, 'Lazy-load hero images', 'Defer offscreen images on the landing page.', 'IN_PROGRESS', NULL, now() - interval '6 days', now() - interval '5 days', now() - interval '6 days'),
            (issue_ids[4], contributing, maya, 'Push notification opt-in screen', 'Ask after first login, not on launch.', 'IN_PROGRESS', guest, now() - interval '18 days', now() - interval '4 days', now() - interval '18 days'),
            (issue_ids[5], contributing, maya, 'Crash on Android 12 cold start', 'Happens on fresh installs only. Fine on 13+.', 'IN_PROGRESS', sam, now() - interval '7 days', now() - interval '2 days', now() - interval '7 days'),
            (issue_ids[6], contributing, maya, 'Accessibility audit', 'Check contrast, labels, and keyboard nav.', 'BACKLOG', NULL, now() - interval '9 days', now() - interval '9 days', now() - interval '9 days'),
            (issue_ids[7], hire_kacy, sam, 'Explore Kacy''s most recent practice project', 'You''re in it right now.', 'DONE', NULL, now() - interval '7 days', now() - interval '6 days 1 hour', now() - interval '7 days'),
            (issue_ids[8], hire_kacy, sam, 'Schedule an interview with Kacy', 'Email: kacycote42@gmail.com | GitHub: github.com/KA-C42', 'IN_PROGRESS', NULL, now() - interval '6 days', now() - interval '1 day', now() - interval '6 days'),
            (issue_ids[9], hire_kacy, sam, 'Send Kacy an offer', 'let''s make her an offer she can''t refuse >:) Email: kacycote42@gmail.com', 'BACKLOG', NULL, now() - interval '6 days', now() - interval '6 days', now() - interval '6 days');

        -- Comments display oldest first, so each one gets its own created_at.
        -- modified_at matches it so none show "(edited)".
        INSERT INTO comments (issue_id, creator_id, comment, created_at, modified_at) VALUES
            (issue_ids[1], sam, 'Go team! We did something!', now() - interval '4 days', now() - interval '4 days'),
            (issue_ids[1], guest, 'Good job Sam! Keep up the good work!', now() - interval '3 days 23 hours', now() - interval '3 days 23 hours'),
            (issue_ids[1], sam, 'What happens when their are too many comments to fit in the box? Will it still be readable?', now() - interval '3 days 22 hours', now() - interval '3 days 22 hours'),
            (issue_ids[1], maya, 'there*', now() - interval '3 days 21 hours', now() - interval '3 days 21 hours'),
            (issue_ids[1], guest, 'woah, chill out maya. No need to get hostile. I''m afraid I have to remove you from the project now', now() - interval '3 days 20 hours', now() - interval '3 days 20 hours'),
            (issue_ids[1], sam, 'oh no! But maya was so cool! I''m gonna invite her back. Please don''t revoke the invite from the Members screen linked via the sidebar', now() - interval '3 days 19 hours', now() - interval '3 days 19 hours'),

            (issue_ids[2], guest, 'Check out ''Lazy-load hero images'' for an issue with no comments, or ''Set up CI for lint and tests'' for many comments!', now() - interval '2 days', now() - interval '2 days'),

            (issue_ids[4], maya, 'Designs are final. Ask for permission after the user does something useful, not on first launch.', now() - interval '5 days', now() - interval '5 days'),
            (issue_ids[4], sam, 'Backend is ready: the device token endpoint is live on staging.', now() - interval '4 days 6 hours', now() - interval '4 days 6 hours'),
            (issue_ids[4], maya, 'This one''s yours. Drag it to Done on the board when it ships!', now() - interval '4 days', now() - interval '4 days'),

            (issue_ids[5], maya, 'Can we get this fixed before Friday''s build?', now() - interval '2 days', now() - interval '2 days'),
            (issue_ids[5], sam, 'Found it: a race in the splash screen init. Fix is up for review.', now() - interval '1 day 20 hours', now() - interval '1 day 20 hours'),
            (issue_ids[5], sam, 'Also, it''s assigned to me, so only maya and I can move it on the board. Nice try.', now() - interval '1 day 19 hours', now() - interval '1 day 19 hours'),

            (issue_ids[6], maya, 'Up for grabs! Anyone on the project can claim an unassigned issue by setting themselves as the assignee.', now() - interval '3 days', now() - interval '3 days'),
            (issue_ids[6], sam, 'Not it. Still fighting the Android crash.', now() - interval '2 days 22 hours', now() - interval '2 days 22 hours'),

            (issue_ids[7], sam, 'Done! You''re looking at it.', now() - interval '6 days', now() - interval '6 days'),
            (issue_ids[7], maya, 'Wait, we''re inside the practice project right now?', now() - interval '5 days 23 hours', now() - interval '5 days 23 hours'),
            (issue_ids[7], sam, 'Yep. Ask her about the backend!', now() - interval '5 days 22 hours', now() - interval '5 days 22 hours'),

            (issue_ids[8], sam, 'Reached out to Kacy. Waiting to hear back on times.', now() - interval '1 day', now() - interval '1 day'),
            (issue_ids[8], maya, 'Make it soon, before someone else does.', now() - interval '20 hours', now() - interval '20 hours'),

            (issue_ids[9], maya, 'Unassigned, so anyone on this project can claim it. Just saying.', now() - interval '12 hours', now() - interval '12 hours');

        -- 6. Invites 
        INSERT INTO invites (project_id, sender_id, recipient_id, sent_at, status_changed_at) VALUES
            (owned, sam, maya, now() - interval '3 days 18 hours', now() - interval '3 days 18 hours'),
            (contributing, sam, jamie, now() - interval '5 hours', now() - interval '5 hours'),
            (hire_kacy, maya, jamie, now() - interval '5 hours', now() - interval '5 hours'),
            (hire_kacy, sam, guest, now() - interval '2 hours', now() - interval '2 hours');

        RETURN NEW;
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER seed_demo_workspace
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.is_anonymous)
    EXECUTE FUNCTION seed_demo_workspace();