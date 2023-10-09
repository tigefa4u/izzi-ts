import { AuthorProps, ChannelProp } from "@customTypes";
import { Client } from "discord.js";
import { RankProps } from "helpers/helperTypes";

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
  | "WORLD_BOSS"
  | "MARKET_PURCHASE"
  | "CONSUME_FODDERS";

type T = "gold" | "orbs" | "raid_pass" | "cards" | "souls";
export type QuestReward = {
  [key in T]: {
    key: string;
    name: string;
    amount: number;
    description?: string;
    rank?: RankProps;
    emoji?: string;
  };
};

export type QuestCriteriaProps = {
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
    purchase?: number;
}
export type QuestProps = {
  id: number;
  name: string;
  description: string;
  difficulty: QuestDifficulty;
  reward: QuestReward;
  criteria: QuestCriteriaProps;
  min_level: number;
  max_level: number;
  is_daily: boolean;
  is_weekly: boolean;
  is_premium: boolean;
  parent_id?: number;
  metadata?: Record<string, unknown>;
  type: QuestTypes;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

type CP = Omit<QuestProps, "id" | "is_deleted" | "created_at" | "updated_at"> &
  Partial<Pick<QuestProps, "is_daily" | "is_premium">>;
export type QuestCreateProps = CP | CP[];

export type QuestUpdateProps = Partial<QuestProps>;

export type QuestParams = {
  id?: number | number[];
  parent_id?: number | number[];
};

export type QuestResultProps = QuestProps & {
  hasCompleted: boolean;
  completed?: number;
  totalMarketPurchase?: number;
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
    rank: RankProps;
  }