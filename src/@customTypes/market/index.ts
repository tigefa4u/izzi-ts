import { CardProps } from "@customTypes/cards";
import { CharacterDetailsProps, CharacterStatProps } from "@customTypes/characters";
import { CollectionProps } from "@customTypes/collections";

export type MarketProps = {
  id: number;
  user_id: number;
  price: number;
  collection_id: number;
};

export type IMarketProps = MarketProps &
  Pick<CharacterDetailsProps, "name" | "abilityname" | "type"> &
  Pick<CollectionProps, "rank" | "souls" | "character_level" | "rank_id" | "character_id"> &
  Pick<CardProps, "filepath" | "metadata"> & {
    user_tag: string;
    stats: CharacterStatProps;
  };

export type MarketCreateProps = Omit<MarketProps, "id"> | Omit<MarketProps, "id">[];

export type MarketLogProps = {
  id: number;
  character_id: number;
  rank_id: number;
  sold_at_cost: number;
  tax_paid: number;
  user_tag: string; // Seller user_tag
  metadata?: Record<string, unknown>;
};

export type MarketLogCreateProps = Omit<MarketLogProps, "id"> | Omit<MarketLogProps, "id">[];