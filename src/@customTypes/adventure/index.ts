import { OverallStatsProps } from "@customTypes";
import { AbilityStatStackProps, CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { Message, MessageEmbed } from "discord.js";

export type EffectivenessProps = {
    water: { affects: [ "fire" ] };
	fire: { affects: [ "grass", "crystal" ] };
	grass: { affects: [ "ground", "water" ] };
	ground: { affects: [ "electric", "poison" ] };
	electric: { affects: [ "water" ] };
	crystal: { affects: [ "ground", "light" ] };
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

type StatStateProps = {
    tempPOM?: number;
    tempCritPOM?: number;
    tempAccPB?: number;
    tempPB?: number;
    exhNum?: number;
    critNum?: number;
    critDamageTemp?: number;
    domNum?: number;
    isPB?: boolean;
    isPOM?: boolean;
    pomNum?: number;
    tempEle?: number;
    tempEleInc?: number;
}

export type AbilityStackProps = StatStateProps & AbilityStatStackProps & {
    isWrecker?: boolean;
    isRage?: boolean;
    isBerserk?: boolean;
    isRevit?: boolean;
    isGuardian?: boolean;
    isKiller?: boolean;
    isFuture?: boolean;
    isEclipse?: boolean;
    isSpirit?: boolean;
    isPred?: boolean;
    isStunned?: boolean;
    isUseWreckerPassive?: boolean;
    isReflectThornmailDamage?: boolean;
    isLifesteal?: boolean;
    lifestealPercent?: number;
    sleepResistPercent?: number;
    isSleepResisted?: boolean;
    restrictResistPercent?: number;
    isRestrictResisted?: boolean;
    fs?: number;
    isAsleep?: boolean;
    isSurge?: boolean;
    surgePercent?: number;
    previousHp?: number;
    isBstrike?: boolean;
    predDex?: number;
    isPlatting?: boolean;
    isEndure?: boolean;
    previousRound?: number;
    isToxic?: boolean;
    isPoisoned?: boolean;
    isStackTB?: boolean;
    isTB?: boolean;
    previousDamage?: number;
    isUseBlizzardPassive?: boolean;
    isBlizzard?: boolean;
    isUseFrostPassive?: boolean;
    isFrost?: boolean;
    isSB?: boolean;
    isTornado?: boolean;
    isUseEvasion?: boolean;
    isExhaust?: boolean;
    isRapid?: boolean;
    isUsePassive?: boolean;
    isDominator?: boolean;
    isUseCrusher?: boolean;
    isPrecision?: boolean;
    isHarbingerOfDeath?: boolean;
    restringHarbingerOfDeathPercent?: number;
}

export type BattleStats = {
    id: string;
    cards: (CollectionCardInfoProps | undefined)[];
    name: string;
    totalStats: OverallStatsProps & AbilityStackProps & {
        health: string[];
        criticalDamage: number;
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
    opponentStats: BattleStats;
    playerStats: BattleStats;
    isPlayerFirst: boolean;
    embed?: MessageEmbed;
    message?: Message;
    card?: CollectionCardInfoProps & AbilityStackProps;
    enemyCard?: CollectionCardInfoProps & AbilityStackProps;
    simulation: Simulation;
}

export type BattleUpdatedStats = {
    damageDiff: number;
    opponentStats: BattleStats;
    damageDealt: number;
    isCriticalHit: boolean | undefined;
    basePlayerStats: BattleStats;
    baseEnemyStats: BattleStats;
}

export type RPGBattleCardDetailProps = CollectionCardInfoProps & {
    selected_card_id: number;
    floor: number;
    ruin: number;
    max_ruin: number;
    max_floor: number;
    max_ruin_floor: number;
}

export type SimulationRound = {
	descriptions: { description: string; delay: number; }[];
	round: number;
	canSimulateRound: boolean;
}
export type Simulation = {
	title: string;
	rounds: {
		[key: string]: SimulationRound;
	},
    hasCrashed: boolean;
	isForfeit: boolean;
}