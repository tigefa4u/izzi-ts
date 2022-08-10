export type GuildEventLobbyProps = {
    [user_id: number]: {
        user_tag: string;
        user_id: number;
        username: string;
        collection_ids: number[];
        gold: number;
    }
}

export type GuildEventMetaProps = {
    role?: string;
    role_name?: string;
    channel?: string;
    channel_name?: string;
}
export type GuildEventsProps = {
    id: number;
    name: string;
    guild_id: string;
    description: string;
    duration: number;
    start_date: Date;
    end_date: Date;
    guild_boss?: string;
    loot?: string;
    lobby?: GuildEventLobbyProps;
    metadata: GuildEventMetaProps;
    is_guild_floor: boolean;
    is_start: boolean;
    has_ended: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

export type GuildEventsCreateProps = Omit<GuildEventsProps, "created_at" | "updated_at" | "id" | "is_deleted">;
export type GuildEventsUpdateProps = Partial<GuildEventsCreateProps> & { is_deleted?: boolean; };
