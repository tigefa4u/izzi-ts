export type CardAndSkinApprovals = {
    id: number;
    name: string;
    guild_id: string;
    is_skin: boolean;
    submitted_by: string;
    metadata?: Record<string, unknown>;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}