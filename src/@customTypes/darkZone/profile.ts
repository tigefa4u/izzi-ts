export type DarkZoneProfileProps = {
    id: number;
    user_tag: string;
    fragments: number;
    floor: number;
    max_floor: number;
    reached_max_floor_at?: string;
    level: number;
    exp: number;
    r_exp: number;
    selected_team_id?: number;
    metadata?: Record<string, unknown>;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
}

type PropsWOmit = Omit<DarkZoneProfileProps, "id" | "created_at" | "updated_at" | "is_deleted">;
export type CreateDarkZoneProfileProps = PropsWOmit | PropsWOmit[];

export type UpdateDarkZoneProfileProps = Partial<DarkZoneProfileProps>;

export type UpdateDarkZoneProfileParamProps = {
    id?: number;
    user_tag?: string;
}
