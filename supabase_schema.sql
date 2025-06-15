
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM type for match status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status_enum') THEN
        CREATE TYPE public.match_status_enum AS ENUM ('scheduled', 'live', 'completed');
    END IF;
END$$;

-- Table: teams
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    coach_name TEXT,
    logo_url TEXT
);
COMMENT ON TABLE public.teams IS 'Stores information about participating teams.';

-- Table: players
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    shirt_number INT2 NOT NULL, -- Small integer for shirt numbers
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    CONSTRAINT players_team_id_shirt_number_key UNIQUE (team_id, shirt_number) -- Ensures unique shirt number per team
);
COMMENT ON TABLE public.players IS 'Stores player information and links them to teams.';

-- Table: matches
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    team_a_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
    team_b_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
    date_time TIMESTAMPTZ NOT NULL,
    venue TEXT,
    status public.match_status_enum DEFAULT 'scheduled'::public.match_status_enum NOT NULL,
    score_a INT2,
    score_b INT2,
    events JSONB, -- For storing match events array
    lineup_a_player_ids UUID[], -- Array of player UUIDs
    lineup_b_player_ids UUID[], -- Array of player UUIDs
    CONSTRAINT check_teams_are_different CHECK (team_a_id <> team_b_id)
);
COMMENT ON TABLE public.matches IS 'Stores details about scheduled, live, and completed matches.';

-- Table: groups
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL UNIQUE
);
COMMENT ON TABLE public.groups IS 'Defines tournament groups.';

-- Table: group_teams (Junction table for group standings)
CREATE TABLE IF NOT EXISTS public.group_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    played INT2 DEFAULT 0 NOT NULL,
    won INT2 DEFAULT 0 NOT NULL,
    drawn INT2 DEFAULT 0 NOT NULL,
    lost INT2 DEFAULT 0 NOT NULL,
    goals_for INT2 DEFAULT 0 NOT NULL,
    goals_against INT2 DEFAULT 0 NOT NULL,
    points INT2 DEFAULT 0 NOT NULL,
    CONSTRAINT group_teams_group_id_team_id_key UNIQUE (group_id, team_id) -- Ensures a team is only once in a group
);
COMMENT ON TABLE public.group_teams IS 'Stores team standings within each group.';

-- Table: tournament_settings (Single row table for global settings)
CREATE TABLE IF NOT EXISTS public.tournament_settings (
    id INT2 PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures only one row with id = 1
    name TEXT NOT NULL DEFAULT 'Trendy''s Tournament Tracker',
    about TEXT,
    logo_url TEXT,
    knockout_image_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.tournament_settings IS 'Stores global tournament settings. Designed for a single row (id=1).';

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.moddatetime_on_settings_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger for tournament_settings updated_at
DROP TRIGGER IF EXISTS handle_settings_updated_at ON public.tournament_settings; -- Drop if exists to avoid error on re-run
CREATE TRIGGER handle_settings_updated_at
BEFORE UPDATE ON public.tournament_settings
FOR EACH ROW
EXECUTE FUNCTION public.moddatetime_on_settings_update();

-- Insert the initial (and only) row for tournament_settings if it doesn't exist
INSERT INTO public.tournament_settings (id, name, about, logo_url, knockout_image_url, updated_at)
VALUES (1, 'Trendy''s Tournament Tracker', 'Welcome to the official tournament tracker app!', NULL, NULL, NOW())
ON CONFLICT (id) DO NOTHING; -- Do nothing if a row with id=1 already exists

-- Enable RLS for tables if you plan to use it. For initial setup, you might manage access via API keys.
-- Example:
-- ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.group_teams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tournament_settings ENABLE ROW LEVEL SECURITY;

-- Remember to set up appropriate policies if RLS is enabled.
-- For example, to allow public read access to teams:
-- CREATE POLICY "Allow public read access to teams" ON public.teams
-- FOR SELECT USING (true);

-- To allow authenticated users to insert/update/delete their own data, policies would be more complex.
-- For admin panel functionality, you might rely on the service_role key on the server-side
-- or specific admin user roles if you implement user authentication for admins.
-- For simplicity in early dev, Row Level Security might be disabled, or very permissive policies used.

-- Example of adding a public read policy to the team-logos bucket (run this in Supabase Storage policies)
/*
This cannot be run as SQL directly in the table editor for storage bucket policies.
You need to go to Supabase Dashboard -> Storage -> Select your 'team-logos' bucket -> Policies -> "New Policy"
Policy Name: Allow public read access
Allowed operations: SELECT
Target roles: anon, authenticated (or just anon if you want truly public URLs)
USING expression (for SELECT): true
*/
