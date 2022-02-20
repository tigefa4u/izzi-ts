import { IgnoreProps } from "@customTypes";
import { CharacterCanvasProps } from "@customTypes/canvas";
import { CharacterStatProps } from "@customTypes/characters";

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
  is_favorite?: boolean;
  row_number?: number;
  created_at: string;
  updated_at: string;
};

export type CollectionParams = {
  is_item?: boolean;
  is_on_market?: boolean;
  id?: number;
  ids?: number[];
  user_id?: number;
  rank?: string | string[];
  rank_ids?: number | number[];
  character_id?: number;
  character_ids?: number[];
  item_id?: number;
  is_favorite?: boolean;
};

export type ItemCollectionCreateProps = Pick<
  CollectionProps,
  "item_id" | "is_item" | "user_id"
>;

export type CollectionUpdateProps = Omit<Partial<CollectionProps>, IgnoreProps | "item_id"> & {
  item_id?: number | null;
};

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

export type CollectionReturnType = CollectionProps & {
  abilityname: string;
  abilitydescription: string;
	name: string;
	type: string;
  itemname?: string;
}

export type CollectionCardInfoProps = CollectionReturnType & {
  filepath: string;
  stats: CharacterStatProps;
  itemdescription?: string;
  characterInfo?: CharacterCanvasProps;
  is_passive?: boolean;
  itemStats?: CharacterStatProps;
}