import { randomNumber } from "helpers";

export const crates = {
	premium: {
		category: "premium",
		price: 0,
		contents: {
			cards: {
				divine: 23,
				immortal: 50,
				exclusive: 20,
				ultimate: 7 
			},
			numberOfCards: randomNumber(3, 5),
			orbs: randomNumber(150, 300)
		},
		is_on_market: false,
	},
	legendary: {
		category: "legendary",
		price: 0,
		contents: {
			cards: {
				legend: 58,
				divine: 22,
				immortal: 15,
				exclusive: 5
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
				diamond: 40,
				legend: 50,
				divine: 10
			},
			numberOfCards: randomNumber(1, 2)
		},
		is_on_market: false,
	}
};