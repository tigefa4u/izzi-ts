import { DungeonLevelProps } from "@customTypes/dungeon";
import { randomElementFromArray, randomNumber } from "helpers";
import { ranksMeta } from "helpers/rankConstants";
import { reorderObjectKey } from "utility";

export const computeLevel = (rank = "duke") => {
	const ranks = getComputedLevels();
	return ranks[rank as keyof DungeonLevelProps];
};

function getComputedLevels(): DungeonLevelProps {
	return {
		duke: {
			rank: ranksMeta.silver.name,
			level: randomNumber(165, 175),
			rank_id: 1,
			name: "duke"
		},
		ranger: {
			rank: randomElementFromArray([ ranksMeta.platinum.name, ranksMeta.gold.name ]),
			level: randomNumber(180, 195),
			rank_id: 2,
			name: "ranger"
		},
		zeke: {
			rank: randomElementFromArray([ ranksMeta.divine.name, ranksMeta.legend.name ]),
			level: randomNumber(190, 200),
			rank_id: 3,
			name: "zeke"
		},
		hero: {
			rank: randomElementFromArray([ ranksMeta.immortal.name, ranksMeta.divine.name ]),
			level: randomNumber(210, 250),
			rank_id: 4,
			name: "hero"
		},
		"grand master": {
			rank: randomElementFromArray([ ranksMeta.exclusive.name, ranksMeta.ultimate.name ]),
			level: randomNumber(260, 300),
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