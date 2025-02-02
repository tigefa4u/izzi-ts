import { OverallStatsProps } from "@customTypes";
import {
	BattleStats,
	EffectivenessProps,
	PrepareBattleDescriptionProps,
} from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { GuildStatProps } from "@customTypes/guilds";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { overallStats } from "helpers";
import loggers from "loggers";
import { getElementalEffectiveStatus } from "modules/commands/rpg/adventure/battle/battle";
import { clone } from "utility";
import { DEFAULT_DPR, ELEMENTAL_ADVANTAGES } from "./constants/constants";
import { RankProps, RanksMetaProps } from "./helperTypes";
import { ranksMeta } from "./constants/rankConstants";

export const prepareHPBar = (num = 12) => {
	const health = [];
	for (let i = 0; i < num; i++) {
		if (i === 0) health.push(emoji.g1);
		if (i === num - 1) health.push(emoji.g3);
		else health.push(emoji.g2);
	}

	return health;
};

// DPR bar (Damage per round) acts as energy to
// increase the bonus % added based on INT
export const prepareEnergyBar = (num = 12) => {
	const energy = [];
	for (let i = 0; i < num; i++) {
		if (i === 0) energy.push(emoji.dpr1);
		if (i === num - 1) energy.push(emoji.dpr3);
		else energy.push(emoji.dpr2);
	}
	return energy;
};

export const preparePlayerStats = async ({
	stats,
	characterLevel,
	rank,
	guildStats,
}: {
  stats: CharacterStatProps;
  characterLevel: number;
  rank: RankProps;
  guildStats?: GuildStatProps;
}): Promise<{
  playerStats: BattleStats["totalStats"];
  baseStats: OverallStatsProps;
}> => {
	const powerLevel = await getPowerLevelByRank({ rank });
	if (!powerLevel) {
		throw new Error("FATAL: Power Level not found for rank: " + rank);
	}
	const result = overallStats({
		stats,
		character_level: characterLevel,
		powerLevel,
		guildStats,
		isForBattle: true,
	});

	const playerStats = {
		health: prepareHPBar(),
		criticalDamage: 1,
		effective: 1,
		character_level: characterLevel,
		energy: prepareEnergyBar(),
		dpr: clone(DEFAULT_DPR),
		...result.totalStats,
	} as BattleStats["totalStats"];

	return {
		playerStats,
		baseStats: result.baseStats,
	};
};

export const effectiveness: EffectivenessProps = {
	water: { affects: [ "fire" ] },
	fire: { affects: [ "grass", "crystal" ] },
	grass: { affects: [ "ground", "water" ] },
	ground: { affects: [ "electric", "poison" ] },
	electric: { affects: [ "water" ] },
	crystal: { affects: [ "ground", "light" ] },
	poison: { affects: [ "wind", "grass" ] },
	wind: { affects: [ "crystal" ] },
	dark: { affects: [ "poison" ] },
	light: { affects: [ "dark" ] },
};

export const addTeamEffectiveness = ({
	cards,
	enemyCards,
	playerStats,
	opponentStats,
}: {
  cards: (CollectionCardInfoProps | undefined)[];
  enemyCards: (CollectionCardInfoProps | undefined)[];
  playerStats: BattleStats["totalStats"];
  opponentStats: BattleStats["totalStats"];
}) => {
	const types = cards.map((c) => String(c?.type)).filter(Boolean);
	const enemyTypes = enemyCards.map((c) => String(c?.type)).filter(Boolean);
	let effective = 0; // range (-9, 9)
	types.map((t) =>
		enemyTypes.map((e) => {
			const result = addEffectiveness({
				playerStats: clone(playerStats),
				playerType: t,
				enemyType: e,
			});
			if (result.effective > 1) {
				effective = effective + 1;
			} else if (result.effective < 1) {
				effective = effective - 1;
			}
			return;
		})
	);

	const isValueNegative = effective < 0;
	let playerEffective = ELEMENTAL_ADVANTAGES.DEFAULT.p1,
		opponentEffective = ELEMENTAL_ADVANTAGES.DEFAULT.p2;
	effective = Math.abs(effective);

	if (effective === 0) {
		playerEffective = ELEMENTAL_ADVANTAGES.NEUTRAL.p1;
		opponentEffective = ELEMENTAL_ADVANTAGES.NEUTRAL.p2;
	} else if (effective === 2) {
		playerEffective = ELEMENTAL_ADVANTAGES.EFFECTIVE.p1;
		opponentEffective = ELEMENTAL_ADVANTAGES.EFFECTIVE.p2;
	} else if (effective >= 3) {
		playerEffective = ELEMENTAL_ADVANTAGES.SUPER_EFFECTIVE.p1;
		opponentEffective = ELEMENTAL_ADVANTAGES.SUPER_EFFECTIVE.p2;
	}
	if (isValueNegative) {
		playerStats.effective = opponentEffective;
		opponentStats.effective = playerEffective;
	} else {
		playerStats.effective = playerEffective;
		opponentStats.effective = opponentEffective;
	}
	return {
		playerStats,
		opponentStats,
	};
};

export const addEffectiveness = ({
	playerType,
	enemyType,
	playerStats,
}: {
  playerType: string;
  enemyType: string;
  playerStats: BattleStats["totalStats"];
}) => {
	try {
		if (effectiveness[playerType as keyof EffectivenessProps]) {
			const index = effectiveness[
        playerType as keyof EffectivenessProps
			].affects.findIndex((i) => i === enemyType);
			if (index >= 0) {
				playerStats.effective = ELEMENTAL_ADVANTAGES.DEFAULT.p1;
			} else {
				Object.keys(effectiveness).forEach((type) => {
					const tempIndex = effectiveness[
            type as keyof EffectivenessProps
					].affects.findIndex((i) => i === playerType);
					if (tempIndex >= 0 && type === enemyType) {
						playerStats.effective = ELEMENTAL_ADVANTAGES.DEFAULT.p2;
					}
				});
			}
		}
	} catch (err) {
		loggers.error("helpers.adventure.addEffectiveness: ERROR", err);
	}
	return playerStats;
};

export const prepareBattleDesc = ({
	playerStats,
	enemyStats,
	description = "",
}: PrepareBattleDescriptionProps) => {
	const desc = `${showBattleDesc(playerStats, enemyStats)}\n\n${showBattleDesc(
		enemyStats,
		playerStats
	)}\n\n${description}`;

	return desc;
};

function showStatsDesc(stats: BattleStats["totalStats"]) {
	const desc =
    `${emoji.crossedswords} \`${Math.floor(stats.vitality)}\` ${
    	emoji.shield2
    } \`${Math.floor(stats.defense)}\` ` +
    `${emoji.armor} \`${Math.floor(stats.intelligence)}\` ${
    	emoji.dash
    } \`${Math.floor(stats.dexterity)}\` ` +
    `${emoji.criticalDamage} \`${stats.criticalDamage.toFixed(2)}\``;
	return desc;
}

function showBattleDesc(playerStats: BattleStats, enemyStats: BattleStats) {
	const filterPlayerCards = playerStats.cards.filter(
		Boolean
	) as CollectionCardInfoProps[];
	const desc = `**${playerStats.name}${
		playerStats.isRageMode ? ` ${emoji.angry}` : ""
	}**\nElement Type: ${filterPlayerCards
		.map((c) => `${emojiMap(c.type)} ${c.itemname ? emojiMap(c.itemname) : ""}`)
		.join(" ")}${
		enemyStats.totalStats.effective < 1
			? `\nEffectiveness: ${getElementalEffectiveStatus(
				enemyStats.totalStats.effective,
				true
			)}`
			: ""
	}\n${
		filterPlayerCards.length === 1
			? `Rank: ${Array(
				ranksMeta[filterPlayerCards[0].rank as keyof RanksMetaProps].size
			)
				.fill(
					emojiMap(
						ranksMeta[filterPlayerCards[0].rank as keyof RanksMetaProps].emoji
					)
				)
				.map((i) => i)
				.join("")}\n`
			: ""
	}Level: ${playerStats.totalStats.character_level}\n${showStatsDesc(
		playerStats.totalStats
	)}\n**${playerStats.totalStats.strength} / ${
		playerStats.totalStats.originalHp
	} ${
		playerStats.totalStats.strength <= 0 ? emoji.skull2 : emoji.hp
	}${prepareAffectedDesc(playerStats)}**\n${playerStats.totalStats.health
		.map((i) => i)
		.join("")}\n${playerStats.totalStats.energy.map((i) => i).join("")}`;

	return desc;
}

function prepareAffectedDesc(playerStats: BattleStats) {
	const desc = `${playerStats.totalStats.isStunned ? emoji.stun : ""} ${
		playerStats.totalStats.isAsleep ? emoji.sleep : ""
	} ${playerStats.totalStats.isRestrictResisted ? emoji.restriction : ""} ${
		playerStats.totalStats.isPoisoned ? emoji.toxic : ""
	} ${playerStats.totalStats.isEndure ? emoji.endurance : ""} ${
		playerStats.totalStats.isStackTB ? emoji.timebomb : ""
	} ${playerStats.totalStats.isBleeding ? emoji.bleed : ""} ${
		playerStats.totalStats.isParanoid ? emoji.paranoid : ""
	}`;

	return desc;
}
