import { TeamMeta } from "@customTypes/teams";

export type DzTeamProps = {
    id: number;
    user_tag: string;
    team: TeamMeta[];
    metadata?: Record<string, unknown>;
}

export type DzTeamCreateProps = Omit<DzTeamProps, "id"> | Omit<DzTeamProps, "id">[];
