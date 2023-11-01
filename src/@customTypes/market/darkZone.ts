import { CardProps } from "@customTypes/cards";
import { CharacterDetailsProps, CharacterStatProps } from "@customTypes/characters";
import { CollectionProps } from "@customTypes/collections";

export type DzMarketProps = {
    id: number;
    collection_id: number;
    user_tag: string;
    price: number;
    stats: CharacterStatProps;
}

export type IDzMarketProps = DzMarketProps &
Pick<CharacterDetailsProps, "name" | "abilityname" | "type"> &
Pick<CollectionProps, "rank" | "character_level" | "rank_id" | "character_id"> &
Pick<CardProps, "filepath" | "metadata"> & { user_id: number; };

export type DzMarketCreateProps = Omit<DzMarketProps, "id"> | Omit<DzMarketProps, "id">[];
