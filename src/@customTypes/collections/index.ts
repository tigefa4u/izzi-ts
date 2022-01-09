import { IgnoreProps } from "@customTypes";

export type CollectionProps = {
  id: number;
  user_id: number;
  character_id: number;
  character_level: number;
  rank: string;
  is_on_market: boolean;
  is_item: boolean;
  item_id: number;
  exp: number;
  r_exp: number;
  souls: number;
  rank_id: number;
  created_at: string;
  updated_at: string;
};

export type CollectionParams = {
  is_item: boolean;
  is_on_market: boolean;
  id?: string;
  ids?: string[];
  user_id?: number;
  rank?: string | string[];
  character_id?: number;
  character_ids?: number[];
  item_id?: number;
};

export type ItemCollectionCreateProps = Pick<
  CollectionProps,
  "item_id" | "is_item" | "user_id"
>;

export type CollectionUpdateProps = Omit<Partial<CollectionProps>, IgnoreProps>;

type IgnoreCollectionCreateProps =
  | IgnoreProps
  | "souls"
  | "item_id"
  | "is_on_market";
export type CollectionCreateProps = Omit<
  CollectionProps,
  IgnoreCollectionCreateProps
>;

export type ICollectionCreateProps =
  | CollectionCreateProps
  | CollectionCreateProps[]
  | ItemCollectionCreateProps
  | ItemCollectionCreateProps[];
