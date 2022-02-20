import { MapProps } from "@customTypes";

export type RanksMetaProps = {
    [key: string]: {
        size: number;
        rank_id: number;
        color?: string;
    }
}

export type ElementTypeColorProps = MapProps;
