import { IgnoreProps } from "@customTypes";
import { CharacterCanvasProps } from "@customTypes/canvas";
import { CardMetadataProps } from "@customTypes/cards";
import { CharacterStatProps } from "@customTypes/characters";
import { RankProps } from "helpers/helperTypes";

export type CollectionProps = {
  id: number;
  user_id: number;
  character_id: number;
  character_level: number;
  rank: RankProps;
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
  total_count?: number;
  is_on_cooldown: boolean;
  is_tradable: boolean;
  card_count?: number;
  name?: string;
  metadata?: {
    nickname?: string;
    tradedAt?: number;
  };
  reqSouls?: number;
  remainingHours?: number;
  remainingMinutes?: number;
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
  exclude_ids?: number[];
  exclude_character_ids?: number[];
  is_on_cooldown?: boolean;
  is_tradable?: boolean;
};

export type ItemCollectionCreateProps = Pick<
  CollectionProps,
  "item_id" | "is_item" | "user_id"
>;

export type CollectionUpdateProps = Omit<
  Partial<CollectionProps>,
  IgnoreProps | "item_id"
> & {
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
  | CollectionCreateProps[];

export type ICollectionItemCreateProps = 
  | ItemCollectionCreateProps
  | ItemCollectionCreateProps[];

export type CollectionReturnType = CollectionProps & {
  abilityname: string;
  abilitydescription: string;
  name: string;
  type: string;
  itemname?: string;
};

export type CollectionCardInfoProps = CollectionReturnType & {
  filepath: string;
  stats: CharacterStatProps & { vitalityInc?: number; };
  itemdescription?: string;
  characterInfo?: CharacterCanvasProps;
  is_passive?: boolean;
  itemStats?: CharacterStatProps & { resist?: number };
  metadata?: CardMetadataProps;
};

export type AbilityStatStackProps = {
  [key in keyof CharacterStatProps as `${key}Temp` | `${key}Inc`]: number;
};

export type CollectionCardInfoByRowNumberParams = {
  row_number: number | number[];
  user_id: number;
  user_tag?: string;
  exclude_ids?: number[];
};

export type CT = { name?: string | string[]; type?: string | string[]; isExactMatch?: boolean; }

export type UpdateCreateFodderProps = {
  count: number;
  user_id: number;
}

type FodderProps = {
	count: number;
	user_id: number;
	character_id: number;
};
export type DirectUpdateCreateFodderProps = FodderProps[];