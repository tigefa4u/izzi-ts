import { randomNumber } from "helpers";
import { crates } from "./crateLoot";

// const basedrops = {
// 	e: 1.25,
// 	m: 2.75,
// 	h: 4.15,
// 	i: 5.65
// }

// // divinde max level b y25% and inc the % based on that
// const levels = {
// 	25: 3,
// 	50: 6,
// 	75: 9,
// 	100: 12
// }

export type LevelBonusDropRateProps = {
	[key: string]: number;
}
export const levelBonusDropRate: LevelBonusDropRateProps = {
	25: 5,
	50: 8,
	75: 12,
	100: 15,
	125: 35,
	150: 50,
};

export type ComputedCategoryProps = {
	[key in "d3" | "d2" | "d1"]: {
		maxlevel: number;
		ranks: string[];
		numberOfCards: {
			[key: string]: {
				cards: number;
				rate: number;
			};
		}
	}
}
export const computedCategoryData : ComputedCategoryProps = {
	d3: {
		maxlevel: 1500,
		ranks: [ "silver", "gold", "platinum" ],
		numberOfCards: {
			legend: {
				cards: 3,
				rate: 4
			},
			immortal: {
				cards: 3,
				rate: 2
			}
		}
	},
	d2: {
		maxlevel: 1850,
		ranks: [ "diamond", "divine", "legend" ],
		numberOfCards: {
			legend: {
				cards: 6,
				rate: 7.35
			},
			immortal: {
				cards: 3,
				rate: 4
			} 
		}
	},
	d1: {
		maxlevel: 1000,
		ranks: [ "immortal", "exclusive", "ultimate" ],
		numberOfCards: {
			legend: {
				cards: 9,
				rate: 12
			},
			immortal: {
				cards: 3,
				rate: 6
			} 
		}
	}
};

const baseLoot = (): any => ({
	e: {
		default: {
			bosses: 1,
			level: [ 500, 1450 ],
			// Must be in order d3, d2, d1
			categories: [ "d3" ],
			chances: [ 100 ],
			loot: {
				gold: randomNumber(18000, 20000),
				extraGold: randomNumber(16000, 18000),
				gamePoints: 1,
				drop: [
					{
						rank: "platinum",
						rank_id: 3,
						number: 62,
					},
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						rate: 1.2,
						number: 3,
					},
					{
						rank: "immortal",
						rank_id: 7,
						/**
						 * Negative rate is used here as base rate
						 * since the rate will gradually increase
						 * when you add category and level rate
						 */
						rate: -5.25,
						number: 1,
					}
				],
			}
		},
		event: {
			level: [ 50, 100 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(18000, 25000),
				extraGold: randomNumber(19000, 20000),
				drop: { shard: randomNumber(10, 14), }
			}
		}
	},
	m: {
		default: {
			bosses: 1,
			level: [ 100, 200 ],
			categories: [ "d3", "d2" ],
			loot: {
				gold: randomNumber(21000, 25000),
				extraGold: randomNumber(22000, 25000),
				gamePoints: 2,
				drop: [
					{
						rank: "platinum",
						rank_id: 3,
						number: 70,
					},
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						rate: 2,
						number: 1,
					},
					{
						rank: "immortal",
						rank_id: 7,
						rate: -4.5,
						number: 1,
					}
				],
			}
		},
		event: {
			level: [ 100, 150 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(25000, 32000),
				extraGold: randomNumber(18000, 18999),
				drop: {
					shard: randomNumber(15, 18),
					orbs: randomNumber(2, 3),
				}
			}
		}
	},
	h: {
		default: {
			bosses: 1,
			level: [ 200, 350 ],
			categories: [ "d3", "d2" ],
			loot: {
				gold: randomNumber(26000, 30000),
				extraGold: randomNumber(25000, 32000),
				gamePoints: 3,
				drop: [
					// {
					// 	rank: "silver",
					// 	rank_id: 1,
					// 	number: 6
					// },
					// {
					// 	rank: "gold",
					// 	rank_id: 2,
					// 	number: 6
					// },
					{
						rank: "platinum",
						rank_id: 3,
						number: 78
					},
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						rate: 3,
						number: 1 // depends on d3, d2, d1
					},
					{
						rank: "immortal",
						rank_id: 7,
						rate: -3.75,
						number: 1,
					}
				],
				worldBoss: {
					// Per battle (50 mana) w 9x fodders
					gold: randomNumber(8000, 9000),
					default: [ {
						rank: "divine",
						rank_id: 6,
						number: 1,
						rate: 15,
						threshold: 2.5,
						extraGold: randomNumber(8000, 9000),
						souls: 5,
						crates: crates.legendary,
						crateDropRate: 5
					}, {
						rank: "immortal",
						rank_id: 7,
						number: 1,
						rate: 25,
						threshold: 10,
						extraGold: randomNumber(10000, 15000),
						souls: 9,
						crates: crates.legendary,
						crateDropRate: 10
					}, {
						rank: "exclusive",
						rank_id: 8,
						number: 1,
						rate: 25,
						threshold: 18,
						extraGold: randomNumber(15000, 20000),
						souls: 15,
						crates: crates.premium,
						crateDropRate: 15
					} ],
				}
			}
		},
		event: {
			level: [ 160, 200 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(32000, 40000),
				extraGold: randomNumber(16000, 17999),
				drop: {
					shard: randomNumber(20, 32),
					orbs: randomNumber(3, 4),
				}
			}
		}
	},
	i: {
		default: {
			bosses: 1,
			level: [ 1000, 1500 ],
			categories: [ "d3", "d2", "d1" ],
			loot: {
				gold: randomNumber(31000, 35000),
				extraGold: randomNumber(32000, 35000),
				gamePoints: 4,
				drop: [
					{
						rank: "platinum",
						rank_id: 3,
						number: 90
					}
				],
				// number of cards depend on category
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						rate: 4.5,
						number: 8,
					},
					{
						rank: "immortal",
						rank_id: 7,
						rate: -3.15,
						number: 1,
					}
				],
			}
		},
		event: {
			level: [ 200, 250 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(40000, 48000),
				extraGold: randomNumber(15000, 15999),
				drop: {
					shard: randomNumber(27, 40),
					orbs: randomNumber(3, 5),
				}
			}
		}
	},
});

export default baseLoot;