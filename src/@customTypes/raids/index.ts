import { AuthorProps, OverallStatsProps } from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { Client } from "discord.js";

export type RaidActionProps = BaseProps & {
    isEvent: boolean;
}

type L = {
    user_tag: string;
    username: string;
    level: number;
    energy: number;
    total_energy: number;
    total_damage: number;
    total_attack: number;
    timestamp: number;
    is_leader: boolean;
    user_id: number;
    votes?: number;
    is_ready?: boolean;
    kickVotes?: {
        [user_id: number]: boolean;
    };
};
export type RaidLobbyProps = {
    [user_id: number]: L;
}

export type RaidLootDropProps = {
    rank: string;
    rank_id: number;
    number: number;
    rate?: number;
}
export type RaidLootProps = {
    gold: number;
    extraGold?: number;
    drop: {
        default?: RaidLootDropProps[];
        event?: {
            shard: number;
            orbs: number;
        }
    };
    rare?: RaidLootDropProps[]
}

export type RaidStatsProps = {
    battle_stats: {
        bosses: number;
        boss_level: number;
        power_level: number;
        stats: OverallStatsProps;
    };
    remaining_strength: number;
    original_strength: number;
    difficulty: string;
    timestamp: number;
}

export type RaidProps = {
    id: number;
    lobby: RaidLobbyProps;
    loot: RaidLootProps;
    stats: RaidStatsProps;
    raid_boss: CollectionCardInfoProps[];
    is_event: boolean;
    is_start: boolean;
    is_private: boolean;
    lobby_member?: L;
}

export type RaidCreateProps = {
    lobby: RaidLobbyProps;
    loot: RaidLootProps;
    stats: RaidStatsProps;
    raid_boss: string;
    is_event: boolean;
    is_start: boolean;
    is_private: boolean;
}

export type RaidUpdateProps = Partial<Omit<RaidCreateProps, "lobby_member">>

export type PrepareLootProps = {
    loot: RaidLootProps;
    bosses: number;
    difficulty: string;
    level: number[];
    rank: string[];
}

export type ProcessRaidLootProps = {
    raid: RaidProps;
    author: AuthorProps;
    client: Client;
    isEvent?: boolean;
}