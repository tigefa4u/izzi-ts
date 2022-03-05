import {
	BattleStats,
	EffectivenessProps,
	PrepareBattleDescriptionProps,
	SimulateBattleProps,
} from "@customTypes/adventure";
import { CharacterStatProps } from "@customTypes/characters";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { GuildStatProps } from "@customTypes/guilds";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { createCanvas, loadImage } from "canvas";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { overallStats } from "helpers";
import loggers from "loggers";
import { clone } from "utility";
import { CANVAS_DEFAULTS, elementTypeColors, ranksMeta } from "./constants";

export const prepareHPBar = (num = 12) => {
	const health = [];
	for (let i = 0; i < num; i++) {
		if (i === 0) health.push(emoji.g1);
		if (i === num - 1) health.push(emoji.g3);
		else health.push(emoji.g2);
	}

	return health;
};

export const preparePlayerStats = async ({
	stats,
	characterLevel,
	rank,
	guildStats,
}: {
  stats: CharacterStatProps;
  characterLevel: number;
  rank: string;
  guildStats?: GuildStatProps;
}): Promise<BattleStats["totalStats"]> => {
	const powerLevel = await getPowerLevelByRank({ rank });
	let statsToAssign = stats;
	if (powerLevel) {
		const totalStats = overallStats({
			stats,
			character_level: characterLevel,
			powerLevel,
			guildStats,
			isForBattle: true,
		});
		statsToAssign = totalStats;
	}
	const playerStats = {
		health: prepareHPBar(),
		criticalDamage: 1,
		effective: 1,
		character_level: characterLevel,
		...statsToAssign,
	} as BattleStats["totalStats"];

	return playerStats;
};

const effectiveness: EffectivenessProps = {
	water: { affects: [ "fire" ] },
	fire: { affects: [ "grass", "crystal" ] },
	grass: { affects: [ "ground" ] },
	ground: { affects: [ "electric" ] },
	electric: { affects: [ "water" ] },
	crystal: { affects: [ "ground" ] },
	poison: { affects: [ "wind", "grass" ] },
	wind: { affects: [ "crystal" ] },
	dark: { affects: [ "poison" ] },
	light: { affects: [ "dark" ] },
};

export const addTeamEffectiveness = async ({
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
	let effective = 0;
	await Promise.all(
		types.map((t) =>
			enemyTypes.map(async (e) => {
				const result = await addEffectiveness({
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
		)
	);

	if (effective > 0) {
		playerStats.effective = 1.5;
		opponentStats.effective = 0.5;
	} else {
		playerStats.effective = 0.5;
		opponentStats.effective = 1.5;
	}
	return {
		playerStats,
		opponentStats,
	};
};

export const addEffectiveness = async ({
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
				playerStats.effective = 1.5;
			} else {
				Object.keys(effectiveness).forEach((type) => {
					const tempIndex = effectiveness[
            type as keyof EffectivenessProps
					].affects.findIndex((i) => i === playerType);
					if (tempIndex >= 0 && type === enemyType) {
						playerStats.effective = 0.5;
					}
				});
			}
		}
		return playerStats;
	} catch (err) {
		loggers.error(
			"helpers.adventure.addEffectiveness(): something went wrong",
			err
		);
	}
	return playerStats;
};

export const prepareBattleDesc = ({
	playerStats,
	enemyStats,
	description = "",
}: PrepareBattleDescriptionProps) => {
	const filterPlayerCards = playerStats.cards.filter(
		Boolean
	) as CollectionCardInfoProps[];
	const filterEnemyCards = enemyStats.cards.filter(
		Boolean
	) as CollectionCardInfoProps[];
	const desc = `**${playerStats.name}**\nElement Type: ${filterPlayerCards
		.map((c) => `${emojiMap(c.type)} ${c.itemname ? emojiMap(c.itemname) : ""}`)
		.join(" ")}\n${
		filterPlayerCards.length === 1
			? `Rank: ${Array(ranksMeta[filterPlayerCards[0].rank].size)
				.fill(":star:")
				.map((i) => i)
				.join("")}\n`
			: ""
	}Level: ${playerStats.totalStats.character_level}\n**${
		playerStats.totalStats.strength
	} / ${playerStats.totalStats.originalHp} ${emoji.hp}${prepareAffectedDesc(
		playerStats
	)}**\n${playerStats.totalStats.health.map((i) => i).join("")}\n\n**${
		enemyStats.name
	}**\nElement Type: ${filterEnemyCards
		.map((c) => `${emojiMap(c.type)} ${c.itemname ? emojiMap(c.itemname) : ""}`)
		.join(" ")}\n${
		filterEnemyCards.length === 1
			? `Rank: ${Array(ranksMeta[filterEnemyCards[0].rank].size)
				.fill(":star:")
				.map((i) => i)
				.join("")}\n`
			: ""
	}Level: ${enemyStats.totalStats.character_level}\n**${
		enemyStats.totalStats.strength
	} / ${enemyStats.totalStats.originalHp} ${
		emoji.hp
	} ${prepareAffectedDesc(enemyStats)}**\n${enemyStats.totalStats.health
		.map((i) => i)
		.join("")}\n\n${description}`;

	return desc;
};

function prepareAffectedDesc(playerStats: BattleStats) {
	const desc = `${playerStats.totalStats.isStunned ? emoji.stun : ""} ${
		playerStats.totalStats.isAsleep ? emoji.sleep : ""
	} ${playerStats.totalStats.isRestrictResisted ? emoji.restriction : ""} ${
		playerStats.totalStats.isPoisoned ? emoji.toxic : ""
	} ${playerStats.totalStats.isEndure ? emoji.endurance : ""}`;

	return desc;
}

export const createBattleCanvas = async (
	cards: (
    | Pick<CollectionCardInfoProps, "filepath" | "type" | "rank">
    | undefined
  )[],
	extras?: {
    isSingleRow: boolean;
  }
) => {
	if (!Array.isArray(cards)) return;
	const canvas = createCanvas(
		CANVAS_DEFAULTS.width,
		extras?.isSingleRow ? CANVAS_DEFAULTS.height / 2 : CANVAS_DEFAULTS.height
	);
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	const bgPath = await loadImage("./assets/images/background.jpg");
	ctx.drawImage(bgPath, 0, 0, canvas.width, canvas.height);
	try {
		const border = await loadImage("./assets/images/border.png");
		const borderCanvas = createCanvas(
			CANVAS_DEFAULTS.cardWidth,
			CANVAS_DEFAULTS.cardHeight
		);
		const borderCtx = borderCanvas.getContext("2d");
		borderCtx.drawImage(border, 0, 0, borderCanvas.width, borderCanvas.height);
		borderCtx.globalCompositeOperation = "source-in";
		const dh = extras?.isSingleRow ? canvas.height : canvas.height / 2;
		for (let i = 0; i < cards.length; i++) {
			const starIconPosition = extras?.isSingleRow
				? dh - 150
				: dh * Math.floor(i / 3) + 220 * 3.7;

			const dy = extras?.isSingleRow
				? 0
				: (canvas.height / 2) * Math.floor(i / 3);
			if (!cards[i]) continue;
			const path = "./assets/images/star.png";
			const star = await loadImage(path);
			const starCanvas = createCanvas(
				CANVAS_DEFAULTS.iconWidth,
				CANVAS_DEFAULTS.iconHeight
			);
			const starCtx = starCanvas.getContext("2d");
			starCtx.drawImage(star, 0, 0, starCanvas.width, starCanvas.height);
			borderCtx.fillStyle = elementTypeColors[cards[i]?.type || ""];
			borderCtx.fillRect(0, 0, borderCanvas.width, borderCanvas.height);
			const filepath = cards[i]?.filepath;
			if (filepath) {
				const image = await loadImage(filepath);
				ctx.drawImage(
					image,
					(canvas.width / 3) * (i % 3),
					dy,
					canvas.width / 3,
					dh
				);
				ctx.drawImage(
					borderCanvas,
					(canvas.width / 3) * (i % 3),
					dy,
					canvas.width / 3,
					dh
				);
				for (let j = 0; j < (ranksMeta[cards[i]?.rank || ""] || {}).size; j++) {
					ctx.drawImage(
						starCanvas,
						j * 48 +
              canvas.width / 3 / 2 +
              (canvas.width / 3) * (i % 3) -
              20 * ((ranksMeta[cards[i]?.rank || ""] || {}).size + 1),
						starIconPosition,
						48,
						48
					);
				}
			}
		}
		return canvas;
	} catch (err) {
		loggers.error(
			"helpers.adventure.createBattleCanvas(): something went wrong",
			err
		);
		return;
	}
};
