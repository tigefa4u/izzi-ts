import { MapProps } from "@customTypes";

export type Ranks =
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "exclusive"
  | "immortal"
  | "ultimate"
  | "legend"
  | "divine";
export type RanksMetaProps = {
  [key in Ranks]: {
    size: number;
    rank_id: number;
    color?: string;
    max_level?: number;
  };
};

export type ElementTypeColorProps = MapProps;
