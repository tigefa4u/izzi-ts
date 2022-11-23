export type ExternalApiProps = {
    id: string;
    user_tag: string;
    bot_id: string;
    secret_key: string;
    public_key: string;
    metadata: any,
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

export type ExternalApiParamProps = {
    user_tag?: string;
    bot_id?: string;
    id?: string;
}

export type ExternalApiCreateProps = Omit<ExternalApiProps, "id" | "is_deleted" | "created_at" | "updated_at">;