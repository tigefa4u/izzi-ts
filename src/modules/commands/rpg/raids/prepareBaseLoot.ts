import { randomNumber } from "helpers";
import { RankProps } from "helpers/helperTypes";
import { ranksMeta } from "helpers/rankConstants";
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

export type LevelAndPLBonusDropRateProps = {
	[key: string]: number;
}
export const levelBonusDropRate: LevelAndPLBonusDropRateProps = {
	25: 5,
	50: 8,
	75: 11,
	100: 14,
	125: 17,
	150: 20,
};

export const PLBonusDropRate: LevelAndPLBonusDropRateProps = {
	3000: .37,
	5000: .82,
	8000: 1.04,
	12000: 1.39,
	15000: 1.74,
	18000: 2.09,
	22000: 2.55,
	25000: 3,
	28000: 3.65,
	32000: 4.45,
	38000: 6,
	55000: 10.35,
	60000: 25,
	100000: 50
};

export type ComputedCategoryProps = {
	[key in "d3" | "d2" | "d1"]: {
		maxlevel: number;
		ranks: RankProps[];
		numberOfCards: {
			[key in RankProps]?: {
				cards: number;
				rate: number;
			};
		}
	}
}
export const computedCategoryData : ComputedCategoryProps = {
	d3: {
		maxlevel: 1800,
		ranks: [ ranksMeta.silver.name, ranksMeta.gold.name, ranksMeta.platinum.name ],
		numberOfCards: {
			[ranksMeta.divine.name]: {
				cards: 3,
				rate: 4
			},
			[ranksMeta.immortal.name]: {
				cards: 3,
				rate: 1.55
			},
			[ranksMeta.mythical.name]: {
				cards: 3,
				rate: .35
			}
		}
	},
	d2: {
		maxlevel: 1800,
		ranks: [ ranksMeta.diamond.name, ranksMeta.divine.name, ranksMeta.legend.name ],
		numberOfCards: {
			[ranksMeta.divine.name]: {
				cards: 6,
				rate: 7.35
			},
			[ranksMeta.immortal.name]: {
				cards: 3,
				rate: 2.15
			},
			[ranksMeta.mythical.name]: {
				cards: 3,
				rate: .65
			}
		}
	},
	d1: {
		maxlevel: 1500,
		// spawning mythical boss in raids was too hard for players
		ranks: [ ranksMeta.immortal.name, ranksMeta.exclusive.name, ranksMeta.ultimate.name ],
		numberOfCards: {
			[ranksMeta.divine.name]: {
				cards: 9,
				rate: 12
			},
			[ranksMeta.immortal.name]: {
				cards: 3,
				rate: 3.65
			},
			[ranksMeta.mythical.name]: {
				cards: 6,
				rate: 1
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
						rank: ranksMeta.platinum.name,
						rank_id: ranksMeta.platinum.rank_id,
						number: 62,
					},
				],
				rare: [
					{
						rank: ranksMeta.divine.name,
						rank_id: ranksMeta.divine.rank_id,
						rate: 1.2,
						number: 3,
					},
					{
						rank: ranksMeta.immortal.name,
						rank_id: ranksMeta.immortal.rank_id,
						/**
						 * Negative rate is used here as base rate
						 * since the rate will gradually increase
						 * when you add category and level rate
						 */
						rate: -8.75,
						number: 1,
					}
				],
				extraCards: [
					{
						rank: ranksMeta.mythical.name,
						rank_id: ranksMeta.mythical.rank_id,
						rate: 1.75,
						number: 1
					}
				]
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
						rank: ranksMeta.platinum.name,
						rank_id: ranksMeta.platinum.rank_id,
						number: 70,
					},
				],
				rare: [
					{
						rank: ranksMeta.divine.name,
						rank_id: ranksMeta.divine.rank_id,
						rate: 2,
						number: 1,
					},
					{
						rank: ranksMeta.immortal.name,
						rank_id: ranksMeta.immortal.rank_id,
						rate: -4.5,
						number: 1,
					}
				],
				extraCards: [
					{
						rank: ranksMeta.mythical.name,
						rank_id: ranksMeta.mythical.rank_id,
						rate: 2.25,
						number: 1
					}
				]
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
			rank: [ ranksMeta.platinum.name, ranksMeta.platinum.name ],
			categories: [ "d3", "d2", "d1" ],
			loot: {
				gold: randomNumber(26000, 30000),
				extraGold: randomNumber(25000, 32000),
				gamePoints: 3,
				drop: [
					{
						rank: ranksMeta.platinum.name,
						rank_id: ranksMeta.platinum.rank_id,
						number: 78
					},
				],
				rare: [
					{
						rank: ranksMeta.divine.name,
						rank_id: ranksMeta.divine.rank_id,
						rate: 3,
						number: 1 // depends on d3, d2, d1
					},
					{
						rank: ranksMeta.immortal.name,
						rank_id: ranksMeta.immortal.rank_id,
						rate: -3.75,
						number: 1,
					}
				],
				extraCards: [
					{
						rank: ranksMeta.mythical.name,
						rank_id: ranksMeta.mythical.rank_id,
						rate: 2.75,
						number: 1
					}
				],
				worldBoss: {
					// Per battle (50 mana) w 9x fodders
					// you can get mythical cards from crates
					gold: randomNumber(8000, 9000),
					default: [ {
						rank: ranksMeta.divine.name,
						rank_id: ranksMeta.divine.rank_id,
						number: 1,
						rate: 15,
						threshold: 2.5,
						extraGold: randomNumber(8000, 9000),
						souls: 5,
						crates: crates.legendary,
						crateDropRate: 5
					}, {
						rank: ranksMeta.immortal.name,
						rank_id: ranksMeta.immortal.rank_id,
						number: 1,
						rate: 25,
						threshold: 10,
						extraGold: randomNumber(10000, 15000),
						souls: 9,
						crates: crates.legendary,
						crateDropRate: 10
					}, {
						rank: ranksMeta.exclusive.name,
						rank_id: ranksMeta.exclusive.rank_id,
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
						rank: ranksMeta.platinum.name,
						rank_id: ranksMeta.platinum.rank_id,
						number: 90
					}
				],
				// number of cards depend on category
				rare: [
					{
						rank: ranksMeta.divine.name,
						rank_id: ranksMeta.divine.rank_id,
						rate: 4.5,
						number: 8,
					},
					{
						rank: ranksMeta.immortal.name,
						rank_id: ranksMeta.immortal.rank_id,
						rate: -3.15,
						number: 1,
					}
				],
				extraCards: [
					{
						rank: ranksMeta.mythical.name,
						rank_id: ranksMeta.mythical.rank_id,
						rate: 3.25,
						number: 1
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