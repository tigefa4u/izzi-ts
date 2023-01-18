export type UserBlacklistProps = {
    id: number;
    user_tag: string;
    username: string;
    offense: number;
    reason?: string;
    metadata: any;
}

export type UserBlacklistCreateProps = Omit<UserBlacklistProps, "id"> | Omit<UserBlacklistProps, "id">[];

export type UserBlacklistUpdateProps = Partial<UserBlacklistProps>;