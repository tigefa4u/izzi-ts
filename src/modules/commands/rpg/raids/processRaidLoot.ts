import { AuthorProps, ChannelProp } from "@customTypes";
import { CollectionCreateProps } from "@customTypes/collections";
import {
	ProcessRaidLootProps,
	RaidLobbyProps,
	RaidLootDropProps,
	RaidProps,
} from "@customTypes/raids";
import { UserProps } from "@customTypes/users";
import { createCollection } from "api/controllers/CollectionsController";
import { deleteRaid, getRaid } from "api/controllers/RaidsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { startTransaction } from "api/models/Users";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import emoji from "emojis/emoji";
import { OWNER_DISCORDID } from "environment";
import { probability, randomElementFromArray } from "helpers";
import {
	QUEST_TYPES,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
} from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import { getLobbyMvp } from "helpers/raid";
import { ranksMeta } from "helpers/rankConstants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { clone, groupByKey, isEmptyValue } from "utility";
import { validateAndCompleteQuest } from "../quests";
import { prepareRaidParty } from "./actions/party";

type R = {
  user_tag: string;
  gold: number;
  orbs?: number;
  shards?: number;
  defaultDrops?: (CollectionCreateProps & { name?: string })[];
  rareDrops?: (CollectionCreateProps & { name?: string })[];
};
export const processRaidLoot = async ({
	client,
	author,
	raid,
	isEvent = false,
}: ProcessRaidLootProps) => {
	try {
		if (raid.stats.remaining_strength > 0) return;

		const raidValid = await getRaid({ id: raid.id });
		if (!raidValid) return;
		await deleteRaid({ id: raid.id });

		const lobby = raid.lobby;
		const keys = Object.keys(lobby).map((i) => Number(i));
		const leechers = keys.filter(
			(x) =>
				raid.lobby[x].total_damage <=
        Math.floor(raid.stats.original_strength * 0.1)
		);

		const mvpUserId = getLobbyMvp(lobby);
		let mvp: number | null = null;
		if (mvpUserId) {
			mvp = mvpUserId;
		}

		const allUsers = (await Promise.all(
			keys
				.map((key) => getRPGUser({ user_tag: lobby[key].user_tag }))
				.filter(Boolean)
		)) as UserProps[];

		const usersMeta = allUsers.reduce((acc, r) => {
			acc[r.id] = r;
			return acc;
		}, {} as { [key: number]: UserProps });

		const allRewards = await Promise.all(
			keys.map(async (key) => {
				const rewards = { user_tag: lobby[key].user_tag } as R;
				const user = usersMeta[key];
				if (!user) return rewards;
				const goldReward =
          raid.loot.gold + Math.floor((raid.loot.extraGold || 0) / keys.length);
				rewards.gold = goldReward;
				user.gold = user.gold + goldReward;
				const updateObj = { gold: user.gold } as UserProps;
				if (raid.loot.drop.event?.orbs) {
					user.orbs = user.orbs + raid.loot.drop.event.orbs;
					rewards.orbs = raid.loot.drop.event.orbs;
					updateObj.orbs = user.orbs;
				}
				if (raid.loot.drop.event?.shard) {
					user.shards = user.shards + raid.loot.drop.event.shard;
					rewards.shards = raid.loot.drop.event.shard;
					updateObj.shards = user.shards;
				}
				if (raid.loot.gamePoints && raid.loot.gamePoints > 0) {
					user.game_points = user.game_points + raid.loot.gamePoints;
					updateObj.game_points = user.game_points;
				}

				await updateRPGUser({ user_tag: user.user_tag }, updateObj);
				if (!raid.loot.drop.default || isEmptyValue(raid.loot.drop.default)) {
					return rewards;
				}
				const promises = [
					initDrops(raid.loot.drop.default, raid, user, false).then(
						(res) => (rewards.defaultDrops = res)
					),
				];
				if (leechers.length > 0) {
					const leecher = leechers.find(
						(l) => raid.lobby[l].user_id === user.id
					);
					if (leecher) {
						await Promise.all(promises);
						return rewards;
					}
				}
				if (raid.loot.rare) {
					/**
			 * Pre-fill the array with all the number of cards that are available to be dropped
			 */
					const array: RaidLootDropProps[] = raid.raid_boss
						.map((boss) =>
							(raid.loot.rare || []).map((r) => Array(r.number).fill("").map((_) => ({
								...r,
								name: boss.name,
								character_id: boss.character_id
							})).flat()).flat()
						)
						.flat();
					promises.push(
						initDrops(
							array,
							raid,
							user,
							true,
							mvp ? lobby[mvp] : undefined
						).then((res) => (rewards.rareDrops = res))
					);
				}
				await Promise.all(promises);
				return rewards;
			})
		);

		if (raid.loot.extraCards && raid.loot.extraCards.length > 0) {
			/**
       * Card drop which is divided among players.
       * Added a pity system to atleast drop 1 card
       * if they have not received any drops for 15 raids.
       */
			const sortedLobby = keys
				.sort((a, b) =>
					raid.lobby[a].total_damage <= raid.lobby[b].total_damage ? 1 : -1
				)
				.filter((uid) => {
					const leecher = leechers.find((l) => raid.lobby[l].user_id === uid);
					return leecher ? false : true;
				});

			/**
			 * Pre-fill the array with all the number of cards that are available to be dropped
			 */
			const extraLoot = clone(raid.loot.extraCards);
			const extraLootArray: RaidLootDropProps[] = raid.raid_boss
				.map((boss) =>
					(extraLoot || []).map((r) => Array(r.number).fill("").map((_) => ({
						...r,
						name: boss.name,
						character_id: boss.character_id
					})).flat()).flat()
				)
				.flat();

			for (const uid of sortedLobby) {
				const user = usersMeta[uid];
				if (!user) continue;
				if (extraLoot.length <= 0) break;
				const drops = await initDrops(
					extraLootArray,
					raid,
					user,
					true,
					mvp ? lobby[mvp] : undefined
				);
				if (drops.length > 0) {
					extraLoot.splice(0, drops.length);
					const idx = allRewards.findIndex((r) => r.user_tag === user.user_tag);
					if (idx >= 0) {
						allRewards[idx].rareDrops = [
							...(allRewards[idx].rareDrops || []),
							...drops
						];
					}
				}
			}
		}

		const collections = allRewards
			.map((reward) => {
				const resp = clone(reward);
				resp.defaultDrops?.map((d: any) => delete d.name);
				resp.rareDrops?.map((d: any) => delete d.name);
				return [
					...(resp.defaultDrops || []),
					...(resp.rareDrops || []),
				] as CollectionCreateProps[];
			})
			.flat();

		await createCollection(collections);

		loggers.info(
			"raid.processRaidLoot: Distributing raid loot rewards: ",
			allRewards
		);

		allRewards.map((reward) =>
			DMUser(
				client,
				prepareRewardEmbed({
					author,
					raid,
					isEvent,
					client,
					reward,
				}),
				reward.user_tag
			)
		);

		let event = false;
		const raidsDisabled = await Cache.get("disable-raids");
		if (raidsDisabled) {
			event = true;
		}
		if (!event) {
			const options = {
				author,
				channel: {} as ChannelProp,
				client,
				extras: {
					characterId: randomElementFromArray(
						raid.raid_boss.map((b) => b.character_id)
					),
					raidRank: raid.stats.rawDifficulty.toLowerCase(),
					raidId: raid.id,
					lobby: raid.lobby,
				},
			};

			const promises = [
				validateAndCompleteQuest({
					user_tag: author.id,
					type: QUEST_TYPES.RAID_CHALLENGE,
					level: 0,
					options,
				}),
				validateAndCompleteQuest({
					type: QUEST_TYPES.RAID_CARRY,
					user_tag: author.id,
					level: 0,
					options,
				}),
			];
			await Promise.all(promises);
		}

		// Collect gold from treasury - hoax acc
		if (OWNER_DISCORDID && raid.loot.extraGold) {
			await Promise.all([
				startTransaction(async (trx) => {
					try {
						await trx("users")
							.where({ user_tag: OWNER_DISCORDID })
							.update({ gold: trx.raw(`gold - ${Number(raid.loot.extraGold)}`), });
						return;
					} catch (err) {
						loggers.error(
							"processRaidLoot.goldTreasury: Transaction Failed",
							err
						);
						return;
					}
				}),
				DMUser(
					client,
					`Raid loot from treasury. ID: ${raid.id}, gold: ${raid.loot.extraGold}, lobby: ${keys.length}`,
					OWNER_DISCORDID
				),
			]);
		}

		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.processRaidLoot: ERROR", err);
		return;
	}
};

function prepareRewardEmbed({
	author,
	raid,
	isEvent,
	client,
	reward,
}: {
  author: AuthorProps;
  client: Client;
  reward: R;
  isEvent: boolean;
  raid: RaidProps;
}) {
	const embed = createEmbed(author, client).setTitle(
		`${isEvent ? "Event" : "Raid"} Boss Defeated!`
	);

	const desc = `Congratulations on defeating ${
		isEvent ? "Event" : "Raid"
	} Boss\n**Level ${raid.stats.battle_stats.boss_level}\n\nSummoner ${
		author.username
	} has dealt the final blow to the ${
		isEvent ? "Event" : "Raid"
	} Boss!\n\nFinal Stats**\n\n${prepareRaidParty(raid.lobby)}\n\n**Rewards ${
		emoji.moneybag
	}**\n__${reward.gold}__ Gold ${emoji.gold}${
		reward.orbs ? `\n__${reward.orbs}__ ${emoji.blueorb}` : ""
	}${reward.shards ? `\n__${reward.shards}__ ${emoji.shard}` : ""}${
		raid.loot.gamePoints && raid.loot.gamePoints > 0
			? `\n__${raid.loot.gamePoints}__ Game Point(s)`
			: ""
	}${prepareDropDesc(reward)}`;

	embed.setDescription(desc);
	return embed;
}

type G = {
  [key: string]: {
    [key: string]: CollectionCreateProps[];
  };
};
function prepareDropDesc(reward: R) {
	let desc = "";
	if (reward.defaultDrops && reward.defaultDrops.length > 0) {
		const groupByName = groupByKey(reward.defaultDrops, "name");
		const defaultDropGroup = {} as G;
		Object.keys(groupByName).map((k) => {
			const groupByRank = groupByKey(groupByName[k], "rank");
			Object.assign(defaultDropGroup, { [k]: groupByRank });
		});
		desc = `${desc}\n${groupAndPrepareLootDesc(reward.defaultDrops)}`;
	}
	if (reward.rareDrops && reward.rareDrops.length > 0) {
		desc = `${desc}\n\n**Additional Drops**\n${groupAndPrepareLootDesc(
			reward.rareDrops
		)}`;
	}

	return desc;
}

function groupAndPrepareLootDesc(
	drop: (CollectionCreateProps & { name?: string })[]
) {
	const groupByName = groupByKey(drop, "name");
	const dropGroup = {} as G;
	Object.keys(groupByName).map((k) => {
		const groupByRank = groupByKey(groupByName[k], "rank");
		Object.assign(dropGroup, { [k]: groupByRank });
	});

	const desc = `${Object.keys(dropGroup)
		.map(
			(name) =>
				`${Object.keys(dropGroup[name])
					.map(
						(r) =>
							`__${dropGroup[name][r].length}x__ __${titleCase(
								r
							)}__ **${titleCase(name)}**`
					)
					.join("\n")}`
		)
		.join("\n")}`;

	return desc;
}

async function initDrops(
	drop: RaidLootDropProps[] = [],
	raid: RaidProps,
	user: UserProps,
	isRare = false,
	mvp?: RaidLobbyProps[number]
) {
	if (!drop || drop.length <= 0) return [];
	let array = clone(drop);
	if (isRare) {
		/**
     * The number of cards and bosses dropped are pre-calculated
     * before this func
     */
		array = array.filter((item) => {
			let rate = item.rate || 10;
			if (mvp && user.id === mvp.user_id && !item.isStaticDropRate) {
				rate = rate + 5;
			}
			if ((user.is_premium || user.is_mini_premium) && !item.isStaticDropRate) {
				rate = rate + 10;
			}
			const dropChance = [ rate, 100 ];
			const ratebool = [ true, false ];
			return ratebool[probability(dropChance)];
		});

		/**
     * Hack - Do not drop more than 1 immo and 2 divs
     */
		const immortalDrops = array.filter(
			(a) => a.rank_id === ranksMeta.immortal.rank_id
		);
		const rest = array.filter(
			(a) =>
				![
					ranksMeta.divine.rank_id,
					ranksMeta.immortal.rank_id,
					ranksMeta.mythical.rank_id,
				].includes(a.rank_id)
		);
		const divineDrops = array.filter(
			(a) => a.rank_id === ranksMeta.divine.rank_id
		);
		const mythicalDrops = array.filter(
			(a) => a.rank_id === ranksMeta.mythical.rank_id
		);
		array = [
			...rest,
			...immortalDrops.slice(0, 1),
			...divineDrops.slice(0, 2),
			...mythicalDrops.slice(0, 1),
		];
	} else {
		// FODDERS
		array = raid.raid_boss
			.map((boss) => {
				return array
					.map((item) => {
						return Array(item.number)
							.fill("")
							.map((_) => {
								return {
									...item,
									character_id: boss.character_id,
									name: boss.name,
								};
							});
					})
					.flat();
			})
			.flat();
	}

	return array.map(
		(item) =>
			({
				character_id: item.character_id,
				character_level: STARTER_CARD_LEVEL,
				exp: STARTER_CARD_EXP,
				r_exp: STARTER_CARD_R_EXP,
				is_item: false,
				is_on_market: false,
				rank: item.rank,
				rank_id: item.rank_id,
				user_id: user.id,
				name: item.name,
				is_on_cooldown: false,
				is_tradable: true,
			} as CollectionCreateProps & { name?: string })
	);
}
