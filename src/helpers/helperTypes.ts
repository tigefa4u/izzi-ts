import { MapProps } from "@customTypes";

type Ranks = "silver" | "gold" | "platinum" | "diamond" | "exclusive" | "immortal" | "ultimate" | "legend" | "divine"
export type RanksMetaProps = {
    [key: string]: {
        size: number;
        rank_id: number;
        color?: string;
    }
}

export type ElementTypeColorProps = MapProps;
