import { randomNumber } from "helpers";
import { crates } from "./crateLoot";

const baseLoot = (): any => ({
	e: {
		default: {
			bosses: 1,
			level: [ 70, 100 ],
			rank: [ "silver" ],
			loot: {
				gold: randomNumber(18000, 20000),
				extraGold: randomNumber(16000, 18000),
				gamePoints: 1,
				drop: [
					// {
					// 	rank: "silver",
					// 	rank_id: 1,
					// 	number: 3,
					// },
					// {
					// 	rank: "gold",
					// 	rank_id: 2,
					// 	number: 3,
					// },
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
						number: 1,
						rate: 7.5
					},
					{
						rank: "divine",
						rank_id: 6,
						rate: 3.25,
						number: 1,
					},
					{
						rank: "immortal",
						rank_id: 7,
						rate: .5,
						number: 1,
						isStaticDropRate: true
					},
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
			rank: [ "silver" ],
			loot: {
				gold: randomNumber(21000, 25000),
				extraGold: randomNumber(22000, 25000),
				gamePoints: 2,
				drop: [
					// {
					// 	rank: "silver",
					// 	rank_id: 1,
					// 	number: 5,
					// },
					// {
					// 	rank: "gold",
					// 	rank_id: 2,
					// 	number: 5,
					// },
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
						number: 1,
						rate: 8.5
					},
					{
						rank: "divine",
						rank_id: 6,
						rate: 6.15,
						number: 1,
					},
					{
						rank: "immortal",
						rank_id: 7,
						rate: 2.25,
						number: 1,
					},
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
			bosses: 3,
			level: [ 200, 350 ],
			rank: [ "platinum" ],
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
						number: 26
					},
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						rate: 12.22,
						number: 1
					},
					{
						rank: "divine",
						rank_id: 6,
						rate: 9.43,
						number: 1,
					},
					{
						rank: "immortal",
						rank_id: 7,
						rate: 3.25,
						number: 1
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
			level: [ 350, 500 ],
			rank: [ "gold", "diamond", "platinum", "legend", "divine" ],
			loot: {
				gold: randomNumber(31000, 35000),
				extraGold: randomNumber(32000, 35000),
				gamePoints: 4,
				drop: [
					{
						rank: "platinum",
						rank_id: 3,
						number: 30
					},
					// {
					// 	rank: "gold",
					// 	rank_id: 2,
					// 	number: 9
					// },
					// {
					// 	rank: "silver",
					// 	rank_id: 1,
					// 	number: 9
					// },
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						rate: 12.22,
						number: 1
					},
					{
						rank: "divine",
						rank_id: 6,
						rate: 10.25,
						number: 1,
					},
					{
						rank: "immortal",
						rank_id: 7,
						rate: 7.75,
						number: 1,
					},
					// {
					// 	rank: "exclusive",
					// 	rank_id: 8,
					// 	rate: 2.15,
					// 	number: 1,
					// 	isStaticDropRate: true
					// }
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