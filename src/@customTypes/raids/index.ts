import { RandomCardProps } from "@customTypes/cards";
import { CharacterStatProps } from "@customTypes/characters";
import { BaseProps } from "@customTypes/command";

export type RaidActionProps = BaseProps & {
    isEvent: boolean;
}

export type RaidLobbyProps = {
    user_id: number,
    energy: number,
    total_energy: number,
    total_damage: number,
    total_attack: number,
    timestamp: number,
    is_leader: boolean,
}

export type RaidLootProps = {
    gold: number;
    extraGold?: number;
    drop: {
        default?: {
            rank: string;
            rank_id: number;
            number: number;
        }[],
        event?: {
            shards: number;
            orbs: number;
        }
    },
    rare?: {
        rank: string;
        rank_id: number;
        rate: number;
        number: number;
    }[]
}

export type RaidStatsProps = {
    battle_stats: {
        bosses: number;
        boss_level: number;
        power_level: number;
        stats: CharacterStatProps;
    };
    remaining_strength: number;
    original_strength: number;
    difficulty: string;
    timestamp: number;
}

export type RaidProps = {
    id: number;
    lobby: RaidLobbyProps[];
    loot: RaidLootProps;
    stats: RaidStatsProps;
    raid_boss: RandomCardProps[];
    is_event: boolean;
    is_start: boolean;
    is_private: boolean;
}

export type RaidCreateProps = {
    lobby: string;
    loot: string;
    stats: string;
    raid_boss: string;
    is_event: boolean;
    is_start: boolean;
    is_private: boolean;
}

export type RaidUpdateProps = Partial<RaidCreateProps>

export type PrepareLootProps = {
    loot: RaidLootProps;
    bosses: number;
    difficulty: string;
    level: number[];
    rank: string[];
}