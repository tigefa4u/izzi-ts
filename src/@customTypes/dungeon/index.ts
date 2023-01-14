import { TeamMeta } from "@customTypes/teams";

type T = "duke" | "ranger" | "zeke" | "hero" | "grand master"
export type DungeonLevelProps = {
    [key in T]: {
        rank: string;
        level: number;
        rank_id: number;
        name: string;
        equipItem?: boolean;
    }
}

export type DungeonProps = {
    id: number;
    user_tag: string;
    username: string;
    team: { name: string; metadata: TeamMeta[]; }; // jsonb
    metadata: {
        attacked?: {
            user_tag: string;
            username: string;
            outcome: "win" | "lose";
            rank: string;
            points: number;
        },
        defended?: {
            user_tag: string;
            username: string;
            outcome: "win" | "lose";
            rank: string;
            points: number;
        },
        shield?: {
            enabled: boolean;
            timestamp: number;
            endsAt: number;
            destroyedBeforeEnd: boolean;
        },
        isValid?: boolean;
    }; // jsonb
};

export type DungeonCreateProps = Omit<DungeonProps, "id"> | Omit<DungeonProps, "id">[];

export type DungeonUpdateProps = Partial<DungeonProps>;

export type DungeonOpponentProps = DungeonProps & {
    rank: string;
    rank_id: number;
};