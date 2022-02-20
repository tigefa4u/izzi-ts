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
		critDamage: 1,
		effective: 1,
		character_level: characterLevel,
		...statsToAssign,
	};

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
	}Level: ${playerStats.totalStats.character_level}\n**${playerStats.totalStats.strength} / ${
		playerStats.totalStats.originalHp
	} ${emoji.hp}**\n${playerStats.totalStats.health
		.map((i) => i)
		.join("")}\n\n**${enemyStats.name}**\nElement Type: ${filterEnemyCards
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
	}**\n${enemyStats.totalStats.health
		.map((i) => i)
		.join("")}\n\n${description}`;

	return desc;
};

export const createBattleCanvas = async (
	cards: (CollectionCardInfoProps | undefined)[]
) => {
	if (!Array.isArray(cards)) return;
	const canvas = createCanvas(CANVAS_DEFAULTS.width, CANVAS_DEFAULTS.height);
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
		for (let i = 0; i < cards.length; i++) {
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
					(canvas.height / 2) * Math.floor(i / 3),
					canvas.width / 3,
					canvas.height / 2
				);
				ctx.drawImage(
					borderCanvas,
					(canvas.width / 3) * (i % 3),
					(canvas.height / 2) * Math.floor(i / 3),
					canvas.width / 3,
					canvas.height / 2
				);
				for (let j = 0; j < (ranksMeta[cards[i]?.rank || ""] || {}).size; j++) {
					ctx.drawImage(
						starCanvas,
						j * 48 +
              canvas.width / 3 / 2 +
              (canvas.width / 3) * (i % 3) -
              20 * ((ranksMeta[cards[i]?.rank || ""] || {}).size + 1),
						(canvas.height / 2) * Math.floor(i / 3) + 220 * 3.7,
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
