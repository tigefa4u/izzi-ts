import { UserRankProps } from "@customTypes/userRanks";
import Cache from "cache";
import connection from "db";
import emoji from "emojis/emoji";
import { randomNumber } from "helpers";
import loggers from "loggers";
import { DMUserViaApi } from "server/pipes/directMessage";
import { success } from "server/responses";
import { clone } from "utility";

export const concludeOrStartDungeons = async (req: any, res: any) => {
	try {
		const seasonEnd = await Cache.get("dg-season-end");
		if (seasonEnd) {
			await Cache.del("dg-season-end");
			return success(res, { message: "New DG season has started!" });
		}
		await Cache.set("dg-season-end", "true");
		await processDGRewards();
		return success(res, { message: "DG Season has ended, and the rewards have been distributed", });
	} catch (err: any) {
		return res.status(500).send({
			error: true,
			message: err.message,
		});
	}
};

/**
 * Example
 * {
    "abilityBans": [{"id": 1, "name": "harbinger of death"}, 
	{ "id": 8, "name": "leer" }]
}
 * @param req
 * @param res 
 * @returns 
 */
export const setDgBans = async (req: any, res: any) => {
	try {
		// fetch all dg teams and reset
		const itemBans = req.body.itemBans || [];
		const abilityBans = req.body.abilityBans || [];
		if (itemBans.length <= 0 && abilityBans.length <= 0) {
			await Cache.del("dg-bans");
			return success(res, { message: "DG Bans are reset" });
		}
		const object = {};
		if (itemBans.length > 0) {
			Object.assign(object, { itemBans });
		}
		if (abilityBans.length > 0) {
			Object.assign(object, { abilityBans });
		}
		await Cache.set("dg-bans", JSON.stringify(object));
		return success(res, { message: "DG Bans are set" });
	} catch (err: any) {
		return res.status(500).send({
			error: true,
			message: err.message
		});
	}
};

export const getDgBans = async (req: any, res: any) => {
	try {
		const item = await Cache.get("dg-bans");
		return success(res, item ? JSON.parse(item) : {});
	} catch (err: any) {
		return res.status(500).send({
			error: true,
			message: err.message
		});
	}
};

const crates: any = {
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
			numberOfCards: randomNumber(1, 3),
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
			numberOfCards: randomNumber(1, 3),
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
			numberOfCards: 10 
		},
		is_on_market: false,
	}
};

const rewardPerRank: any = {
	5: {
		reward: [ {
			rank: "premium",
			num: 1
		}, {
			rank: "legendary",
			num: 3
		} ],
		message: "- 1x __Premium__ crates\n- 2x __Legendary__ crates"
	},
	4: {
		reward: [ {
			rank: "legendary",
			num: 2
		}, {
			rank: "silver",
			num: 4
		} ],
		message: "- 1x __Legendary__ crates\n- 4x __Silver__ crates"
	},
	3: {
		reward: [ {
			rank: "legendary",
			num: 1
		}, {
			rank: "silver",
			num: 6
		} ],
		message: "- 1x __Legendary__ crates\n- 6x __Silver__ crates"
	},
};
const processDGRewards = async () => {
	const top10 = await getData({ limit: 10 });
	const userRanks = await getData({ offset: 10 });

	// Use Queue to avoid DM rate limiting
	const usersToDm: { message: string; id: string; }[] = [];
	const dataToCreate: any[] = [];
	await Promise.all(
		top10.map(async (user, index) => {
			const winRatio = user.wins / user.loss;
			const goldReward = Math.floor(winRatio * 500000);
			await Promise.all(
				[ ...Array(2).fill("premium"), ...Array(4).fill("legendary") ].map(
					async (crateCat) => {
						const crateItem = clone(crates[crateCat]);
						crateItem.user_tag = user.user_tag;
						dataToCreate.push(crateItem);
						return;
					}
				)
			).catch((err) => {
				loggers.error(
					"server.controllers.DungeonController.processDGRewards: something horrible happened:",
					err
				);
				return;
			});
			await connection.raw(
				`update users set gold = gold + ${goldReward} where user_tag = '${user.user_tag}'`
			);

			const message =
        `Congratulations Summoner ${
        	emoji.celebration
        }! Dungeon Season has ended. You ranked **__#${
        	index + 1
        }__** this season and received\n**- __${goldReward}__ Gold ${
        	emoji.gold
        }` + "\n- 2x __Premium__ crates\n- 4x __Legendary__ crates**";

			usersToDm.push({
				id: user.user_tag,
				message
			});
			// await DMUserViaApi(user.user_tag, { content: message });
		})
	);

	await Promise.all(userRanks.map(async (user, index) => {
		const reward = rewardPerRank[user.rank_id];
		if (reward) {
			await Promise.all(reward.reward.map(async (item: any) => {
				for (let i = 0; i < item.num; i++) {
					const crateItem = clone(crates[item.rank]);
					crateItem.user_tag = user.user_tag;
					dataToCreate.push(crateItem);
				}
			}));
			const message = `Congratulations Summoner ${emoji.celebration}! ` +
            `Dungeon Season has ended. You ranked **__#${(index + 1) + 10}__** this season and ` +
            `received\n**${reward.message}**`;

			usersToDm.push({
				id: user.user_tag,
				message
			});
			// await DMUserViaApi(user.user_tag, { content: message });
		}
	}));
	await Promise.all([
		connection("crates").insert(dataToCreate),
		DMWinners,
		backupSeasonRanks([ ...top10, ...userRanks ]),
		resetDG() ]);
};

async function DMWinners(users: { message: string; id: string; }[]) {
	for (let i = 0; i < users.length; i++) {
		const user = users[i];
		await DMUserViaApi(user.id, { content: user.message });
	}
}

async function resetDG() {
	await connection.raw("update user_ranks set rank = 'duke', rank_id = 1, exp = 0, wins = 0, " +
    "loss = 0, r_exp = 50, division = 1");
}

async function backupSeasonRanks(data: any) {
	const res = data.map((item: any) => {
		return  {
			user_tag: item.user_tag,
			season: 4,
			wins: item.wins,
			loss: item.loss,
			rank: item.rank,
			division: item.division
		};
	});
	await connection("season_ranks").insert(res);
}

const tableName = "user_ranks";

async function getData({
	limit,
	offset,
}: {
  limit?: number;
  offset?: number;
}): Promise<UserRankProps[]> {
	let query = connection(tableName)
		.orderBy(`${tableName}.rank_id`, "desc")
		.orderBy(`${tableName}.division`, "desc")
		.orderBy(`${tableName}.exp`, "desc")
		.orderBy(`${tableName}.wins`, "desc");
	if (limit) {
		query = query.limit(limit);
	}
	if (offset) {
		query = query.offset(offset);
	}
	return await query;
}
