import { randomElementFromArray, randomNumber } from "helpers";

const baseLoot = (): any => ({
	e: {
		default: {
			level: [ 70, 120 ],
			rank: [ "silver" ],
			loot: {
				gold: randomNumber(20000, 25000),
				extraGold: randomNumber(16000, 18000),
				drop: [
					{
						rank: "silver",
						rank_id: 1,
						number: 3,
					},
					{
						rank: "gold",
						rank_id: 2,
						number: 3,
					},
					{
						rank: "platinum",
						rank_id: 3,
						number: 3,
					},
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						number: 1,
						rate: 12.5
					},
					{
						rank: "divine",
						rank_id: 6,
						rate: 8.5,
						number: 1,
					},
					{
						rank: "immortal",
						rank_id: 7,
						rate: 2,
						number: 1,
						isStaticDropRate: true
					},
				],
			}
		},
		event: {
			level: [ 180, 220 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(18000, 25000),
				extraGold: randomNumber(16000, 18000),
				drop: { shard: randomNumber(10, 14), }
			}
		}
	},
	m: {
		default: {
			level: [ 150, 300 ],
			rank: [ "silver" ],
			loot: {
				gold: randomNumber(25000, 30000),
				extraGold: randomNumber(22000, 25000),
				drop: [
					{
						rank: "silver",
						rank_id: 1,
						number: 4,
					},
					{
						rank: "gold",
						rank_id: 2,
						number: 4,
					},
					{
						rank: "platinum",
						rank_id: 3,
						number: 4,
					},
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						number: 1,
						rate: 14.5
					},
					{
						rank: "divine",
						rank_id: 6,
						rate: 10.5,
						number: 1,
					},
					{
						rank: "immortal",
						rank_id: 7,
						rate: 4,
						number: 1,
					},
				],
			}
		},
		event: {
			level: [ 450, 520 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(25000, 32000),
				extraGold: randomNumber(20000, 22000),
				drop: {
					shard: randomNumber(15, 18),
					orbs: randomNumber(2, 3),
				}
			}
		}
	},
	h: {
		default: {
			level: [ 350, 480 ],
			rank: [ "platinum", "platinum" ],
			loot: {
				gold: randomNumber(35000, 40000),
				extraGold: randomNumber(25000, 32000),
				drop: [
					{
						rank: "silver",
						rank_id: 1,
						number: 5
					},
					{
						rank: "gold",
						rank_id: 2,
						number: 5
					},
					{
						rank: "platinum",
						rank_id: 3,
						number: 5
					},
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						rate: 16.2,
						number: 1
					},
					{
						rank: "divine",
						rank_id: 6,
						rate: 12.4,
						number: 1,
					},
					{
						rank: "immortal",
						rank_id: 7,
						rate: 6.5,
						number: 1
					}
				]
			}
		},
		event: {
			level: [ 630, 680 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(32000, 40000),
				extraGold: randomNumber(25000, 27000),
				drop: {
					shard: randomNumber(20, 32),
					orbs: randomNumber(3, 4),
				}
			}
		}
	},
	i: {
		default: {
			level: [ 500, 700 ],
			rank: [ "gold", "diamond", "platinum", "legend", "divine" ],
			loot: {
				gold: randomNumber(40000, 45000),
				extraGold: randomNumber(32000, 35000),
				drop: [
					{
						rank: "platinum",
						rank_id: 3,
						number: 6
					},
					{
						rank: "gold",
						rank_id: 2,
						number: 6
					},
					{
						rank: "silver",
						rank_id: 1,
						number: 6
					},
				],
				rare: [
					{
						rank: "divine",
						rank_id: 6,
						rate: 14.5,
						number: 1,
					},
					{
						rank: "immortal",
						rank_id: 7,
						rate: 8,
						number: 1,
					},
					{
						rank: "exclusive",
						rank_id: 8,
						rate: 5,
						number: 1
					}
				],
			}
		},
		event: {
			level: [ 700, 750 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(40000, 48000),
				extraGold: randomNumber(29000, 30000),
				drop: {
					shard: randomNumber(27, 40),
					orbs: randomNumber(3, 5),
				}
			}
		}
	},
});

export default baseLoot;