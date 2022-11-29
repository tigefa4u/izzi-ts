import { CharacterStatProps } from "@customTypes/characters";

export type GuildProps = {
  id: number;
  guild_id: string;
  guild_name: string;
  guild_stats?: Omit<
    CharacterStatProps,
    "critical" | "accuracy" | "evasion" | "precision"
  > | null;
  item_stats?: Omit<
    CharacterStatProps,
    "critical" | "accuracy" | "evasion" | "precision"
  > | null;
  name?: string | null;
  prefix: string;
  gold: number;
  points: number;
  guild_level: number;
  max_members: number;
  is_active: boolean;
  is_deleted: boolean;
  is_banned: boolean;
  ban_reason?: string;
  metadata?: string; // guild previous stats (on delete)
  banner?: string;
  max_admin_slots: number;
};

export type GuildCreateProps = Omit<GuildProps, "id">;

export type GuildParams = Partial<Pick<GuildProps, "guild_id" | "id">>;

export type GuildUpdateProps = Partial<GuildCreateProps>;

export type GuildMaterializedViewProps = {
  guild_id: number;
  role: "leader" | "vice_leader" | "admin";
  user_id: number;
  user_tag: string;
  username: string;
};

export type GuildMemberAndItemCountProps = {
  type: "items" | "members";
  count: number;
};

export type GuildStatProps = GuildProps["guild_stats"];