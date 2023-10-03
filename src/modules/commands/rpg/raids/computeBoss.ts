import { MapProps } from "@customTypes";
import { PrepareLootProps } from "@customTypes/raids";
import { probability, randomElementFromArray } from "helpers";
import loggers from "loggers";
import prepareBaseLoot, { computedCategoryData, ComputedCategoryProps } from "./prepareBaseLoot";

const difficultyObj: MapProps = {
	e: "easy",
	h: "hard",
	m: "medium",
	i: "immortal",
	easy: "easy",
	hard: "hard",
	medium: "medium",
	immortal: "immortal",
};

const reverseMap: MapProps = {
	easy: "e",
	hard: "h",
	medium: "m",
	immortal: "i",
	e: "e",
	m: "m",
	h: "h",
	i: "i",
};

const coupleEventLevels: any = {
	e: [ 100, 200 ],
	m: [ 250, 350 ],
	h: [ 400, 500 ],
	i: [ 550, 650 ],
};

export const computeRank = (
	difficulty = "e",
	isEvent = false,
	isWorldBoss = false,
	level = 25
) => {
	return prepareLoot(difficulty, isEvent, isWorldBoss, level);
};

type C = {
    d3?: number;
    d2?: number;
    d1?: number;
  }
const computeBossByPlayerLevel = (
	level: number,
	raidBossCategories: ("d3" | "d2" | "d1")[]
) => {
	let categoryAndlevelPercent: C = { d3: 50 };
	let chances = [ 100 ];
	let bosses = 1;
	if (level >= 55) {
		bosses = 3;
	}
	if (level <= 25) {
		categoryAndlevelPercent = {
			d3: 100,
			d2: 50,
		};
		chances = [ 100, 25 ];
	} else if (level <= 30) {
		categoryAndlevelPercent = {
			d3: 100,
			d2: 75,
		};
		chances = [ 100, 50 ];
	} else if (level <= 50) {
		categoryAndlevelPercent = {
			d3: 125,
			d2: 100,
			d1: 50,
		};
		chances = [ 10, 60, 25 ];
	} else if (level <= 124) {
		categoryAndlevelPercent = {
			d3: 100,
			d2: 100,
			d1: 100,
		};
		chances = [ 10, 100, 100 ];
	} else if (level <= 125) {
		categoryAndlevelPercent = {
			d2: 100,
			d1: 100,
		};
		chances = [ 100, 500 ];	
	} else if (level <= 160) {
		categoryAndlevelPercent = {
			d2: 100,
			d1: 100,
		};
		chances = [ 100, 500 ];		
	} else {
		categoryAndlevelPercent = {
			d2: 100,
			d1: 100,
		};
		chances = [ 100, 500 ];	
	}
	let spawnCategory = Object.keys(categoryAndlevelPercent)[
		probability(chances)
	] as keyof ComputedCategoryProps;
	if (raidBossCategories.length <= 0) {
		spawnCategory = "d3";
	} else {
		const found = raidBossCategories.find((c) => c === spawnCategory);
		if (!found) {
			spawnCategory = raidBossCategories[raidBossCategories.length - 1];
		}
	}
	const lowerLevel = Math.ceil(computedCategoryData[spawnCategory].maxlevel * .5);
	const higherLevel = Math.ceil(
		(computedCategoryData[spawnCategory].maxlevel *
      (categoryAndlevelPercent[spawnCategory as keyof C] || 50) / 100)
	);
	const ranks = computedCategoryData[spawnCategory].ranks;
	return {
		lowerLevel,
		higherLevel,
		ranks,
		numberOfCards: computedCategoryData[spawnCategory].numberOfCards,
		spawnCategory,
		bosses
	};
};

function prepareLoot(
	difficulty = "e",
	isEvent = false,
	isWorldBoss = false,
	level = 25
): PrepareLootProps | undefined {
	const result = {
		loot: {
			drop: {
				default: {},
				event: {},
			},
		},
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
		const resp = computeBossByPlayerLevel(
			level,
			baseLoot[difficulty].default.categories,
		);
		result.bosses = resp.bosses || 1;
		result.loot.drop.default = baseLoot[difficulty].default.loot.drop;
		result.loot.rare = baseLoot[difficulty].default.loot.rare;
		// Extra cards are drops that are truly divided among lobby members
		// similar to extraGold
		result.loot.extraCards = baseLoot[difficulty].default.loot.extraCards;

		loggers.info("Computed boss by player level:", resp);

		// result.loot.drop.default?.map((d) => {
		// 	d.number = Math.floor(d.number / result.bosses);
		// });
		// result.loot.rare?.map((r) => {
		// 	const rank = r.rank as keyof ComputedCategoryProps["d3" | "d2" | "d1"]["numberOfCards"];
		// 	// Make this change if you decide to add more ranks
		// 	if (resp.numberOfCards[rank]) {
		// 		r.rate = (r.rate || 0) + resp.numberOfCards[rank].rate;
		// 		if (!r.isStaticDrop) {
		// 			r.number = Math.floor(resp.numberOfCards[rank].cards / result.bosses);
		// 		}
		// 	}
		// });
		result.level = [ resp.lowerLevel, resp.higherLevel ];
		result.rank = resp.ranks;
		result.loot.gold = baseLoot[difficulty].default.loot.gold;
		result.loot.extraGold = baseLoot[difficulty].default.loot.extraGold;
		result.extras = resp;
		// result.loot.gamePoints = 0;
		// result.loot.gamePoints = baseLoot[difficulty].default.loot.gamePoints;
	}

	return result;
}
