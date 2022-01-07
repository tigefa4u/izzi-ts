import { CardProps } from "@customTypes/cards";
import { CharacterCardProps } from "@customTypes/characters";
import { ZoneProps } from "@customTypes/zones";

export type StageProps = {
  id: number;
  location_id: number;
  floor: number;
  level: number;
  card_id: number;
  created_at: string;
  updated_at: string;
}

export type NormalizeFloorProps = {
  floors: number[];
  zone: number;
}

export type BattleStageProps = StageProps &
  Pick<CardProps, "character_id" | "rank"> &
  Pick<ZoneProps, "max_floor" | "filepath">

export type BattleCardProps = BattleStageProps & Omit<CharacterCardProps, "id"> & { zone_filepath: string }
