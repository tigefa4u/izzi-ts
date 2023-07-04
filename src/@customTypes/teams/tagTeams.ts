export type TagTeamPlayerProps = {
    username: string;
    user_tag: string;
    teammate: string;
}

export type TagTeamProps = {
    id: number;
    name: string;
    players: {
        [key: string]: TagTeamPlayerProps;
    };
    points: number;
    metadata?: Record<string, unknown>;
    is_deleted: boolean;
}

type CreateProps = Pick<TagTeamProps, "name" | "players">;
export type TagTeamCreateProps = CreateProps | CreateProps[];

export type TagTeamUpdateProps = Partial<TagTeamProps>;
