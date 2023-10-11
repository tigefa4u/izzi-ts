import { randomNumber } from "helpers";
import { ranksMeta } from "helpers/constants/rankConstants";

export const crates = {
	premium: {
		category: "premium",
		price: 0,
		contents: {
			cards: {
				[ranksMeta.divine.name]: 23,
				[ranksMeta.immortal.name]: 50,
				[ranksMeta.exclusive.name]: 20,
				[ranksMeta.ultimate.name]: 7,
				[ranksMeta.mythical.name]: 1
			},
			numberOfCards: randomNumber(3, 4),
			orbs: randomNumber(150, 300)
		},
		is_on_market: false,
	},
	legendary: {
		category: "legendary",
		price: 0,
		contents: {
			cards: {
				[ranksMeta.legend.name]: 58,
				[ranksMeta.divine.name]: 22,
				[ranksMeta.immortal.name]: 15,
				[ranksMeta.exclusive.name]: 5
			},
			numberOfCards: randomNumber(2, 3),
			orbs: randomNumber(100, 200)
		},
		is_on_market: false,
	},
	silver: {
		category: "silver",
		price: 0,
		contents: {
			cards: {
				[ranksMeta.diamond.name]: 40,
				[ranksMeta.legend.name]: 50,
				[ranksMeta.divine.name]: 10
			},
			numberOfCards: randomNumber(1, 2)
		},
		is_on_market: false,
	}
};