import { randomNumber } from "helpers";
import { RankProps } from "helpers/helperTypes";
import { ranksMeta } from "helpers/constants/rankConstants";
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
};
export const levelBonusDropRate: LevelAndPLBonusDropRateProps = {
	25: 5,
	50: 8,
	75: 11,
	100: 14,
	125: 17,
	150: 20,
};

export const levelBonusForFragments: LevelAndPLBonusDropRateProps = {
	25: 10,
	50: 15,
	75: 20,
	100: 25,
	125: 30,
	150: 40
};

export const PLBonusDropRate: LevelAndPLBonusDropRateProps = {
	3000: 0.37,
	5000: 0.82,
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
	100000: 50,
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
    };
  };
};
export const computedCategoryData: ComputedCategoryProps = {
	d3: {
		maxlevel: 1700,
		ranks: [
			ranksMeta.silver.name,
			ranksMeta.gold.name,
			ranksMeta.platinum.name,
		],
		numberOfCards: {
			[ranksMeta.divine.name]: {
				cards: 3,
				rate: 6,
			},
			[ranksMeta.immortal.name]: {
				cards: 3,
				rate: 2.55,
			},
			[ranksMeta.mythical.name]: {
				cards: 3,
				rate: 0.05,
			},
		},
	},
	d2: {
		maxlevel: 2000,
		ranks: [
			ranksMeta.diamond.name,
			ranksMeta.divine.name,
			ranksMeta.legend.name,
		],
		numberOfCards: {
			[ranksMeta.divine.name]: {
				cards: 6,
				rate: 9.35,
			},
			[ranksMeta.immortal.name]: {
				cards: 3,
				rate: 4.15,
			},
			[ranksMeta.mythical.name]: {
				cards: 3,
				rate: 0.1,
			},
		},
	},
	d1: {
		maxlevel: 1800,
		// spawning mythical boss in raids was too hard for players.
		ranks: [
			ranksMeta.immortal.name,
			ranksMeta.exclusive.name,
			ranksMeta.ultimate.name,
			ranksMeta.mythical.name,
		],
		numberOfCards: {
			[ranksMeta.divine.name]: {
				cards: 9,
				rate: 14,
			},
			[ranksMeta.immortal.name]: {
				cards: 3,
				rate: 5.65,
			},
			[ranksMeta.mythical.name]: {
				cards: 6,
				rate: 0.25,
			},
		},
	},
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
				// gold: randomNumber(17000, 19000),
				extraGold: randomNumber(15000, 17000),
				gold: randomNumber(18000, 20000), // original
				// gold: randomNumber(15000, 17000),
				// extraGold: randomNumber(16000, 18000),
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
					},
				],
				extraCards: [
					{
						rank: ranksMeta.mythical.name,
						rank_id: ranksMeta.mythical.rank_id,
						rate: 0.75,
						number: 1,
						isStaticDropRate: true,
					},
				],
			},
		},
		event: {
			level: [ 50, 100 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(17000, 19000),
				extraGold: randomNumber(15000, 17000),
				drop: { shard: randomNumber(20, 24) },
			},
		},
		darkZone: {
			level: [ 50, 100 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(17000, 19000),
				extraGold: randomNumber(15000, 17000),
				drop: {
					fragments: randomNumber(180, 200),
					exp: randomNumber(20, 30) 
				},
			},
		},
	},
	m: {
		default: {
			bosses: 1,
			level: [ 100, 200 ],
			categories: [ "d3", "d2" ],
			loot: {
				// gold: randomNumber(20000, 23000),
				// extraGold: randomNumber(18000, 20000),
				// original
				gold: randomNumber(21000, 25000),
				extraGold: randomNumber(22000, 25000),
				//
				// gold: randomNumber(18000, 20000),
				// extraGold: randomNumber(19000, 21000),
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
					},
				],
				extraCards: [
					{
						rank: ranksMeta.mythical.name,
						rank_id: ranksMeta.mythical.rank_id,
						rate: 1.45,
						number: 1,
						isStaticDropRate: true,
					},
				],
			},
		},
		event: {
			level: [ 100, 150 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(20000, 23000),
				extraGold: randomNumber(18000, 20000),
				drop: {
					shard: randomNumber(25, 28),
					orbs: randomNumber(2, 3),
				},
			},
		},
		darkZone: {
			level: [ 100, 150 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(20000, 23000),
				extraGold: randomNumber(18000, 20000),
				drop: {
					fragments: randomNumber(200, 220),
					exp: randomNumber(30, 40) 
				},
			},
		},
	},
	h: {
		default: {
			bosses: 1,
			level: [ 200, 350 ],
			rank: [ ranksMeta.platinum.name, ranksMeta.platinum.name ],
			categories: [ "d3", "d2", "d1" ],
			loot: {
				// gold: randomNumber(25000, 27000),
				// extraGold: randomNumber(23000, 25000),
				// original
				gold: randomNumber(26000, 30000),
				extraGold: randomNumber(25000, 32000),
				//
				// gold: randomNumber(21000, 23000),
				// extraGold: randomNumber(22000, 24000),
				gamePoints: 3,
				drop: [
					{
						rank: ranksMeta.platinum.name,
						rank_id: ranksMeta.platinum.rank_id,
						number: 78,
					},
				],
				rare: [
					{
						rank: ranksMeta.divine.name,
						rank_id: ranksMeta.divine.rank_id,
						rate: 3,
						number: 1, // depends on d3, d2, d1
					},
					{
						rank: ranksMeta.immortal.name,
						rank_id: ranksMeta.immortal.rank_id,
						rate: -3.75,
						number: 1,
					},
				],
				extraCards: [
					{
						rank: ranksMeta.mythical.name,
						rank_id: ranksMeta.mythical.rank_id,
						rate: 2.15,
						number: 1,
						isStaticDropRate: true,
					},
				],
				worldBoss: {
					// Per battle (50 mana) w 9x fodders
					// you can get mythical cards from crates
					gold: randomNumber(8000, 9000),
					default: [
						{
							rank: ranksMeta.divine.name,
							rank_id: ranksMeta.divine.rank_id,
							number: 1,
							rate: 15,
							threshold: 2.5,
							extraGold: randomNumber(8000, 9000),
							souls: 5,
							crates: crates.legendary,
							crateDropRate: 5,
						},
						{
							rank: ranksMeta.immortal.name,
							rank_id: ranksMeta.immortal.rank_id,
							number: 1,
							rate: 25,
							threshold: 10,
							extraGold: randomNumber(10000, 15000),
							souls: 9,
							crates: crates.legendary,
							crateDropRate: 10,
						},
						{
							rank: ranksMeta.exclusive.name,
							rank_id: ranksMeta.exclusive.rank_id,
							number: 1,
							rate: 25,
							threshold: 18,
							extraGold: randomNumber(15000, 20000),
							souls: 15,
							crates: crates.premium,
							crateDropRate: 15,
						},
					],
				},
			},
		},
		event: {
			level: [ 160, 200 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(25000, 27000),
				extraGold: randomNumber(23000, 25000),
				drop: {
					shard: randomNumber(30, 42),
					orbs: randomNumber(3, 4),
				},
			},
		},
		darkZone: {
			level: [ 160, 200 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(25000, 27000),
				extraGold: randomNumber(23000, 25000),
				drop: {
					fragments: randomNumber(220, 240),
					exp: randomNumber(40, 50) 
				},
			},
		},
	},
	i: {
		default: {
			bosses: 1,
			level: [ 1000, 1500 ],
			categories: [ "d3", "d2", "d1" ],
			loot: {
				// gold: randomNumber(29000, 31000),
				// extraGold: randomNumber(27000, 29000),
				// original
				gold: randomNumber(31000, 35000),
				extraGold: randomNumber(32000, 35000),
				//
				// gold: randomNumber(24000, 26000),
				// extraGold: randomNumber(25000, 27000),
				gamePoints: 4,
				drop: [
					{
						rank: ranksMeta.platinum.name,
						rank_id: ranksMeta.platinum.rank_id,
						number: 90,
					},
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
					},
				],
				extraCards: [
					{
						rank: ranksMeta.mythical.name,
						rank_id: ranksMeta.mythical.rank_id,
						rate: 2.85,
						number: 1,
						isStaticDropRate: true,
					},
				],
			},
		},
		event: {
			level: [ 200, 250 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(29000, 31000),
				extraGold: randomNumber(27000, 29000),
				drop: {
					shard: randomNumber(37, 50),
					orbs: randomNumber(3, 5),
				},
			},
		},
		darkZone: {
			// the ranks is computed by categories in 'default' prop
			level: [ 200, 250 ],
			rank: [
				ranksMeta.exclusive.name,
				ranksMeta.ultimate.name,
				ranksMeta.mythical.name,
				ranksMeta.immortal.name,
			],
			loot: {
				gold: randomNumber(29000, 31000),
				extraGold: randomNumber(27000, 29000),
				drop: {
					fragments: randomNumber(240, 260),
					exp: randomNumber(50, 60) 
				},
			},
		},
	},
});

export default baseLoot;
