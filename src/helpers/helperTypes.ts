import { MapProps } from "@customTypes";

export type RankProps =
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "exclusive"
  | "immortal"
  | "ultimate"
  | "legend"
  | "divine"
  // | "mythical";
export type RanksMetaProps = {
  [key in RankProps]: {
    size: number;
    rank_id: number;
    color?: string;
    max_level?: number;
    emoji: string;
    name: RankProps;
  };
};

export type ElementTypeColorProps = MapProps;
