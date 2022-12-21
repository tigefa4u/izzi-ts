import { MapProps } from "@customTypes";
import { PrepareLootProps } from "@customTypes/raids";
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

export const computeRank = (difficulty = "e", isEvent = false) => {
	return prepareLoot(difficulty, isEvent);
};

function prepareLoot(
	difficulty = "e",
	isEvent = false
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
		result.level = baseLoot[difficulty].event.level;
		result.rank = baseLoot[difficulty].event.rank;
		result.loot.gold = baseLoot[difficulty].event.loot.gold;
		result.loot.extraGold = baseLoot[difficulty].event.loot.extraGold;
	} else {
		result.bosses = 3;
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
