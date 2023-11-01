import { CharacterStatProps } from "@customTypes/characters";
import { RankProps } from "helpers/helperTypes";

export type DarkZoneInventoryMetadataProps = {
    nickname?: string;
}
export type DarkZoneInventoryProps = {
    id: number;
    user_tag: string;
    rank_id: number;
    rank: RankProps;
    skin_id?: number;
    is_tradable: boolean;
    character_id: number;
    exp: number;
    r_exp: number;
    character_level: number;
    is_favorite: boolean;
    is_on_market: boolean;
    stats: CharacterStatProps;
    metadata?: DarkZoneInventoryMetadataProps;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
    row_number?: number;
    name?: string;
};

export type DarkZoneInvUpdateProps = Partial<DarkZoneInventoryProps>;

type PropsWOmit = Omit<DarkZoneInventoryProps, "id" | "created_at" | "updated_at" | "is_deleted">;
export type CreateDarkZoneInvProps = PropsWOmit | PropsWOmit[];

export type DzInventoryParams = {
    id?: number;
    ids?: number[];
    user_tag?: string;
    rank?: string | string[];
    rank_ids?: number | number[];
    character_id?: number;
    character_ids?: number[];
    is_favorite?: boolean;
    exclude_ids?: number[];
    exclude_character_ids?: number[];
    is_tradable?: boolean;
    is_on_market?: boolean;
  };

export type DzInventoryReturnType = DarkZoneInventoryProps & {
    abilityname: string;
    abilitydescription: string;
    name: string;
    type: string;
}