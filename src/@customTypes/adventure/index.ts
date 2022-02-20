import { OverallStatsProps } from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { MessageEmbed } from "discord.js";

export type EffectivenessProps = {
    water: { affects: [ "fire" ] };
	fire: { affects: [ "grass", "crystal" ] };
	grass: { affects: [ "ground" ] };
	ground: { affects: [ "electric" ] };
	electric: { affects: [ "water" ] };
	crystal: { affects: [ "ground" ] };
	poison: { affects: [ "wind", "grass" ] };
	wind: { affects: [ "crystal" ] };
	dark: { affects: [ "poison" ] };
	light: { affects: [ "dark" ] };
}

export type SimulateBattleProps = {
    context: BaseProps["context"];
    playerStats: BattleStats;
    enemyStats: BattleStats;
    title: string;
}

export type BattleStats = {
    id: string;
    cards: (CollectionCardInfoProps | undefined)[];
    name: string;
    totalStats: OverallStatsProps & {
        health: string[];
        critDamage: number;
        effective: number;
        character_level: number;
        isCriticalHit?: boolean;
        isEvadeHit?: boolean;
    };
    totalDamage?: number;
    isVictory?: boolean;
    isForfeit?: boolean;
}

export type PrepareBattleDescriptionProps = {
    playerStats: SimulateBattleProps["playerStats"];
    enemyStats: SimulateBattleProps["enemyStats"];
    totalDamage: number;
    description?: string;
}

export type BattleProcessProps = {
    round: number;
    basePlayerStats: BattleStats;
    baseEnemyStats: BattleStats;
    opponentStats?: BattleStats;
    playerStats: BattleStats;
    isPlayerFirst: boolean;
    embed: MessageEmbed;
}

export type BattleUpdatedStats = {
    damageDiff: number;
    opponentStats: BattleStats;
    damageDealt: number;
    isCriticalHit: boolean | undefined;
    basePlayerStats: BattleStats;
    baseEnemyStats: BattleStats;
}