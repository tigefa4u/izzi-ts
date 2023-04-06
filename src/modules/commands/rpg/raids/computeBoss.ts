import { MapProps } from "@customTypes";
import { PrepareLootProps } from "@customTypes/raids";
import { randomElementFromArray } from "helpers";
import prepareBaseLoot from "./prepareBaseLoot";

const difficultyObj: MapProps = {
	e: "easy",
	h: "hard",
	m: "medium",
	i: "immortal",
	easy: "easy",
	hard: "hard",
	medium: "medium",
	immortal: "immortal"
};

const reverseMap: MapProps = {
	easy: "e",
	hard: "h",
	medium: "m",
	immortal: "i",
	e: "e",
	m: "m",
	h: "h",
	i: "i"
};

const coupleEventLevels: any = {
	e: [ 100, 200 ],
	m: [ 250, 350 ],
	h: [ 400, 500 ],
	i: [ 550, 650 ]
};

export const computeRank = (difficulty = "e", isEvent = false, isWorldBoss = false) => {
	return prepareLoot(difficulty, isEvent, isWorldBoss);
};

function prepareLoot(
	difficulty = "e",
	isEvent = false,
	isWorldBoss = false
): PrepareLootProps | undefined {
	const result = {
		loot: {
			drop: {
				default: {},
				event: {}
			}
		}
	} as PrepareLootProps;
	difficulty = reverseMap[difficulty];
	if (!difficulty) {
		difficulty = "e";
	}
	result.difficulty = difficultyObj[difficulty as keyof MapProps];
	if (!result.difficulty) {
		result.difficulty = "easy";
	}
	const baseLoot = prepareBaseLoot();
	if (isEvent === true) {
		result.bosses = 1;
		result.loot.drop.event = baseLoot[difficulty].event.loot.drop;
		result.level = coupleEventLevels[difficulty];
		result.rank = baseLoot[difficulty].event.rank;
		result.loot.gold = baseLoot[difficulty].event.loot.gold;
		result.loot.extraGold = baseLoot[difficulty].event.loot.extraGold;
		// result.group_id = randomElementFromArray([ 1, 2, 3 ]);
	} else if (isWorldBoss) {
		result.bosses = 1;
		result.loot.drop.worldBoss = baseLoot[difficulty].default.loot.worldBoss;
		result.rank = baseLoot[difficulty].default.rank;
		result.level = baseLoot[difficulty].default.level;
	} else {
		result.bosses = baseLoot[difficulty].default.bosses || 3;
		result.loot.drop.default = baseLoot[difficulty].default.loot.drop;
		result.loot.rare = baseLoot[difficulty].default.loot.rare;
		result.level = baseLoot[difficulty].default.level;
		result.rank = baseLoot[difficulty].default.rank;
		result.loot.gold = baseLoot[difficulty].default.loot.gold;
		result.loot.extraGold = baseLoot[difficulty].default.loot.extraGold;
		// result.loot.gamePoints = 0;
		// result.loot.gamePoints = baseLoot[difficulty].default.loot.gamePoints;
	}

	return result;
}
