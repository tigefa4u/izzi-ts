export type WishlistProps = {
    id: number;
    character_id: number;
    user_tag: string;
    is_skin: boolean;
    metadata: {
        filepath?: string;
        name?: string;
    };
    name?: string;
    skin_id?: number;
};

export type WishlistCreateProps = Omit<WishlistProps, "id"> | Omit<WishlistProps, "id">[];

export type WishlistParamProps = Partial<Pick<WishlistProps, "user_tag" | "character_id" | "is_skin">>;

export type WishlistUpdateProps = Partial<Omit<WishlistProps, "id">>;

export type WishlistUpdateParamProps = { id: number; user_tag: string; };