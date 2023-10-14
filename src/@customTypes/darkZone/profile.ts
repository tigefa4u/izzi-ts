import { CardMetadataAssetProps } from "@customTypes/cards";

export type DarkZoneProfileMetadataProps = {
    username?: string;
    showcase?: {
        selected_card_id: number;
    }
}
export type DarkZoneProfileProps = {
  id: number;
  user_tag: string;
  fragments: number;
  floor: number;
  max_floor: number;
  reached_max_floor_at?: string;
  level: number;
  exp: number;
  r_exp: number;
  selected_team_id?: number;
  metadata?: DarkZoneProfileMetadataProps;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  inventory_count: number; // Keeps track of inv, easy query access
};

type PropsWOmit = Pick<DarkZoneProfileProps, "user_tag" | "inventory_count" | "metadata">;
export type CreateDarkZoneProfileProps = PropsWOmit | PropsWOmit[];

export type UpdateDarkZoneProfileProps = Partial<DarkZoneProfileProps>;

export type UpdateDarkZoneProfileParamProps = {
  id?: number;
  user_tag?: string;
};
