import { AuthorProps, OverallStatsProps } from "@customTypes";
import { CardParams } from "@customTypes/cards";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { Client } from "discord.js";
import { RankProps } from "helpers/helperTypes";

export type RaidActionProps = BaseProps & {
    isEvent: boolean;
    external_character_ids?: number[];
    customSpawn?: boolean;
    customSpawnParams?: CardParams;
    darkZoneSpawn?: boolean;
}

type L = {
    user_tag: string;
    username: string;
    level: number;
    energy: number;
    total_energy: number;
    total_damage: number;
    total_team_damage: number;
    total_attack: number;
    timestamp: number;
    is_leader: boolean;
    user_id: number;
    votes?: number;
    is_ready?: boolean;
    is_mvp?: boolean;
    kickVotes?: {
        [user_id: number]: boolean;
    };
};
export type RaidLobbyProps = {
    [user_id: number]: L;
}

export type RaidLootDropProps = {
    rank: RankProps;
    rank_id: number;
    number: number;
    rate?: number;
    isStaticDropRate?: boolean;
    isStaticDrop?: boolean;
    character_id?: number;
    name?: string;
}
export type RaidLootProps = {
    gold: number;
    extraGold?: number;
    gamePoints?: number;
    drop: {
        default?: RaidLootDropProps[];
        event?: {
            shard: number;
            orbs: number;
        };
        // Normal izzi exp
        darkZone?: { fragments: number; exp: number; };
        worldBoss?: {
            gold: number;
            default: {
                rank: RankProps;
                rank_id: number;
                number: number;
                rate: number;
                threshold: number;
                extraGold: number;
                souls: number;
                crates: {
                    category: string;
                    price: 0;
                    contents: Record<string, unknown>;
                    is_on_market: boolean;
                };
                crateDropRate: number;
            }[];
        };
    };
    rare?: RaidLootDropProps[];
    extraCards?: RaidLootDropProps[];
    division?: string;
}

export type RaidStatsProps = {
    battle_stats: {
        bosses: number;
        boss_level: number;
        power_level: number;
        stats: OverallStatsProps;
        energy?: number;
    };
    remaining_strength: number;
    original_strength: number;
    difficulty: string;
    timestamp: number;
    rawDifficulty: string;
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
    created_at?: string;
    is_dark_zone?: boolean;
    is_world_boss?: boolean;
}

export type RaidCreateProps = {
    lobby: RaidLobbyProps;
    loot: RaidLootProps;
    stats: RaidStatsProps;
    raid_boss: string;
    is_event: boolean;
    is_start: boolean;
    is_private: boolean;
    is_world_boss?: boolean;
    filter_data: string;
    is_dark_zone?: boolean;
}

export type RaidUpdateProps = Partial<Omit<RaidCreateProps, "lobby_member">>

export type PrepareLootProps = {
    loot: RaidLootProps;
    bosses: number;
    difficulty: string;
    level: number[];
    rank: RankProps[];
    group_id?: number;
    extras?: any;
}

export type ProcessRaidLootProps = {
    raid: RaidProps;
    author: AuthorProps;
    client: Client;
    isEvent?: boolean;
}