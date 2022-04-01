import { randomElementFromArray, randomNumber } from "helpers";

const baseLoot: any = {
	e: {
		default: {
			level: [ 60, 75 ],
			rank: [ "silver" ],
			loot: {
				gold: randomNumber(20000, 30000),
				extraGold: randomNumber(16000, 18000),
				drop: [
					{
						rank: "silver",
						rank_id: 1,
						number: randomElementFromArray([ 8, 10 ]) || 1,
					},
					{
						rank: "gold",
						rank_id: 2,
						number: randomElementFromArray([ 8, 10 ]) || 1,
					},
					{
						rank: "platinum",
						rank_id: 3,
						number: randomElementFromArray([ 8, 10 ]) || 1,
					},
				],
				rare: [
					{
						rank: "diamond",
						rank_id: 4,
						number: 1,
						rate: 15.5
					}
				],
			}
		},
		event: {
			level: [ 180, 220 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(18000, 28000),
				extraGold: randomNumber(16000, 18000),
				drop: { shard: randomNumber(10, 14), }
			}
		}
	},
	m: {
		default: {
			level: [ 130, 140 ],
			rank: [ "silver" ],
			loot: {
				gold: randomNumber(30000, 40000),
				extraGold: randomNumber(22000, 25000),
				drop: [
					{
						rank: "silver",
						rank_id: 1,
						number: randomElementFromArray([ 10, 12 ]) || 1,
					},
					{
						rank: "gold",
						rank_id: 2,
						number: randomElementFromArray([ 10, 12 ]) || 1,
					},
					{
						rank: "platinum",
						rank_id: 3,
						number: randomElementFromArray([ 10, 12 ]) || 1,
					},
				],
				rare: [
					{
						rank: "diamond",
						rank_id: 4,
						number: 1,
						rate: 17.5
					},
					{
						rank: "legend",
						rank_id: 5,
						number: 1,
						rate: 10
					}
				],
			}
		},
		event: {
			level: [ 450, 480 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(28000, 38000),
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
			level: [ 170, 200 ],
			rank: [ "platinum", "platinum" ],
			loot: {
				gold: randomNumber(40000, 50000),
				extraGold: randomNumber(25000, 32000),
				drop: [
					{
						rank: "silver",
						rank_id: 1,
						number: randomElementFromArray([ 12, 14 ]) || 1,
					},
					{
						rank: "gold",
						rank_id: 2,
						number: randomElementFromArray([ 12, 14 ]) || 1,
					},
					{
						rank: "platinum",
						rank_id: 3,
						number: randomElementFromArray([ 12, 14 ]) || 1,
					},
					{
						rank: "diamond",
						rank_id: 4,
						number: randomElementFromArray([ 3, 4 ]) || 1,
					},
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						rate: 10.2,
						number: 1
					},
					{
						rank: "divine",
						rank_id: 6,
						rate: 6.4,
						number: 1,
					},
				]
			}
		},
		event: {
			level: [ 500, 530 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(38000, 48000),
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
			level: [ 280, 310 ],
			rank: [ "diamond", "platinum" ],
			loot: {
				gold: randomNumber(50000, 60000),
				extraGold: randomNumber(32000, 35000),
				drop: [
					{
						rank: "platinum",
						rank_id: 3,
						number: randomElementFromArray([ 14, 16 ]) || 1,
					},
					{
						rank: "gold",
						rank_id: 2,
						number: randomElementFromArray([ 14, 16 ]) || 1,
					},
					{
						rank: "silver",
						rank_id: 1,
						number: randomElementFromArray([ 14, 16 ]) || 1,
					},
					{
						rank: "diamond",
						rank_id: 4,
						number: randomElementFromArray([ 6, 8 ]) || 1,
					},
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						number: randomElementFromArray([ 2, 3 ]) || 1,
						rate: 15.5
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
						rate: 8,
						number: 1,
					},
				],
			}
		},
		event: {
			level: [ 550, 620 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(48000, 58000),
				extraGold: randomNumber(29000, 30000),
				drop: {
					shard: randomNumber(27, 40),
					orbs: randomNumber(3, 5),
				}
			}
		}
	},
};

export default baseLoot;