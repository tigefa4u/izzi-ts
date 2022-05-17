import { CardProps } from "@customTypes/cards";
import { CharacterDetailsProps } from "@customTypes/characters";
import { CollectionProps } from "@customTypes/collections";

export type MarketProps = {
  id: number;
  user_id: number;
  price: number;
  collection_id: number;
};

export type IMarketProps = MarketProps &
  Pick<CharacterDetailsProps, "name" | "abilityname" | "type"> &
  Pick<CollectionProps, "rank" | "souls" | "character_level"> &
  Pick<CardProps, "filepath" | "metadata">;

export type MarketCreateProps = Omit<MarketProps, "id"> | Omit<MarketProps, "id">[];