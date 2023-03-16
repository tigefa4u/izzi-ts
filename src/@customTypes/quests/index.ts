import { AuthorProps, ChannelProp } from "@customTypes";
import { Client } from "discord.js";

export type QuestDifficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestTypes =
  | "RAID_CHALLENGE"
  | "RAID_CARRY"
  | "CARD_LEVELING"
  | "WEBPAGES"
  | "TRADING"
  | "MARKET"
  | "DUNGEON"
  | "PVP"
  | "WORLD_BOSS";

type T = "gold" | "orbs" | "raid_pass" | "cards";
export type QuestReward = {
  [key in T]: {
    key: string;
    name: string;
    amount: number;
    description?: string;
    rank?: string;
    emoji?: string;
  };
};

export type QuestCriteria = {
    toComplete?: number;
    difficulty?: string;
    isMvp?: boolean;
    isLeastAttacks?: boolean;
    rank?: string;
    mingold?: number;
    maxlevel?: number;
    pages?: number;
    cardsToTrade?: number;
    incrementLevelBy?: number;
    isAnyDifficulty?: boolean;
}
export type QuestProps = {
  id: number;
  name: string;
  description: string;
  difficulty: QuestDifficulty;
  reward: QuestReward;
  criteria: QuestCriteria;
  min_level: number;
  max_level: number;
  is_daily: boolean;
  is_special: boolean;
  parent_id?: number;
  metadata?: Record<string, unknown>;
  type: QuestTypes;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

type CP = Omit<QuestProps, "id" | "is_deleted" | "created_at" | "updated_at"> &
  Partial<Pick<QuestProps, "is_daily" | "is_special">>;
export type QuestCreateProps = CP | CP[];

export type QuestUpdateProps = Partial<QuestProps>;

export type QuestParams = {
  id?: number | number[];
  parent_id?: number | number[];
};

export type QuestResultProps = QuestProps & {
  hasCompleted: boolean;
  completedRaids?: number;
};

export type ProcessQuestProps<ET> = {
    type: QuestTypes;
    user_tag: string;
    level: number;
    options: {
        author: AuthorProps;
        channel: ChannelProp;
        client: Client;
        extras?: ET
    };
    isDMUser?: boolean;
}

export type QuestCompleteCardRewardProps = {
    rank_id: number;
    character_id: number;
    user_id: number;
    rank: string;
  }