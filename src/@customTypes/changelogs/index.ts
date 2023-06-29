export type ChangeLogProps = {
    id: number;
    name: string;
    description: string;
    metadata?: Record<string, unknown>;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}