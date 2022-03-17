import { randomElementFromArray, randomNumber } from "helpers";

const baseLoot: any = {
	e: {
		default: {
			level: [ 60, 75 ],
			rank: [ "silver" ],
			loot: {
				gold: randomNumber(18000, 20000),
				extraGold: randomNumber(16000, 18000),
				drop: [
					{
						rank: "silver",
						rank_id: 1,
						number: randomElementFromArray([ 1, 2 ]) || 1,
					},
					{
						rank: "gold",
						rank_id: 2,
						number: randomElementFromArray([ 1, 2 ]) || 1,
					},
					{
						rank: "platinum",
						rank_id: 3,
						number: randomElementFromArray([ 2, 3 ]) || 1,
					},
				]
			}
		},
		event: {
			level: [ 180, 220 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(13000, 15000),
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
				gold: randomNumber(25000, 30000),
				extraGold: randomNumber(22000, 25000),
				drop: [
					{
						rank: "silver",
						rank_id: 1,
						number: randomElementFromArray([ 2, 3 ]) || 1,
					},
					{
						rank: "gold",
						rank_id: 3,
						number: randomElementFromArray([ 2, 3 ]) || 1,
					},
					{
						rank: "platinum",
						rank_id: 3,
						number: randomElementFromArray([ 2, 3 ]) || 1,
					},
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						number: 1,
						rate: 5
					}
				],
			}
		},
		event: {
			level: [ 450, 480 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(17000, 19000),
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
				gold: randomNumber(22000, 25000),
				extraGold: randomNumber(20000, 22000),
				drop: [
					{
						rank: "silver",
						rank_id: 1,
						number: randomElementFromArray([ 2, 3 ]) || 1,
					},
					{
						rank: "gold",
						rank_id: 2,
						number: randomElementFromArray([ 2, 3 ]) || 1,
					},
					{
						rank: "platinum",
						rank_id: 3,
						number: randomElementFromArray([ 2, 3 ]) || 1,
					},
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						rate: 5,
						number: 1
					},
					{
						rank: "divine",
						rank_id: 6,
						rate: 3.5,
						number: 1,
					},
				]
			}
		},
		event: {
			level: [ 500, 530 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(21000, 24000),
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
				gold: randomNumber(35000, 40000),
				extraGold: randomNumber(25000, 30000),
				drop: [
					{
						rank: "platinum",
						rank_id: 3,
						number: randomElementFromArray([ 2, 3 ]) || 1,
					},
					{
						rank: "gold",
						rank_id: 2,
						number: randomElementFromArray([ 2, 3 ]) || 1,
					},
					{
						rank: "silver",
						rank_id: 1,
						number: randomElementFromArray([ 2, 3 ]) || 1,
					},
				],
				rare: [
					{
						rank: "legend",
						rank_id: 5,
						number: randomElementFromArray([ 2, 3 ]) || 1,
						rate: 14
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
						rate: 5,
						number: 1,
					},
				],
			}
		},
		event: {
			level: [ 550, 620 ],
			rank: [ "exclusive", "exclusive" ],
			loot: {
				gold: randomNumber(24000, 28000),
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