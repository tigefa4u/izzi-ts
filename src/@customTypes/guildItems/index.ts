import { GuildMarketProps } from "@customTypes/guildMarkets";

export type GuildItemProps = {
  id: number;
  item_id: number;
  quantity: number;
  guild_id: number;
};

export type GuildItemResponseProps = GuildItemProps &
  Pick<GuildMarketProps, "description" | "name" | "price" | "filepath">;

export type GuildItemParams = {
  guild_id: number;
  id?: number;
  ids?: number[]
};

export type GuildItemCreateProps =
  | Omit<GuildItemProps, "id">
  | Omit<GuildItemProps, "id">[];
