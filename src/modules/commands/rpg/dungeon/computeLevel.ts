import { DungeonLevelProps } from "@customTypes/dungeon";
import { randomElementFromArray, randomNumber } from "helpers";
import { reorderObjectKey } from "utility";

export const computeLevel = (rank = "duke") => {
	const ranks = getComputedLevels();
	return ranks[rank as keyof DungeonLevelProps];
};

function getComputedLevels(): DungeonLevelProps {
	return {
		duke: {
			rank: "silver",
			level: randomNumber(165, 175),
			rank_id: 1,
			name: "duke"
		},
		ranger: {
			rank: randomElementFromArray([ "platinum", "gold" ]),
			level: randomNumber(180, 195),
			rank_id: 2,
			name: "ranger"
		},
		zeke: {
			rank: randomElementFromArray([ "divine", "legend" ]),
			level: randomNumber(190, 200),
			rank_id: 3,
			name: "zeke"
		},
		hero: {
			rank: randomElementFromArray([ "immortal", "divine" ]),
			level: randomNumber(200, 220),
			rank_id: 4,
			name: "hero"
		},
		"grand master": {
			rank: randomElementFromArray([ "immortal", "immortal" ]),
			level: randomNumber(220, 280),
			rank_id: 5,
			name: "grand master",
			equipItem: true
		}
	};
}

export const reducedComputedLevels = () => {
	const ranks = getComputedLevels();
	const toArray = Object.keys(ranks).map((r) => ranks[r as keyof DungeonLevelProps]);
	return reorderObjectKey(toArray, "rank_id");
};