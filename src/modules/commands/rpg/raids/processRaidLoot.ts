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
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import emoji from "emojis/emoji";
import { probability, randomElementFromArray } from "helpers";
import {
	QUEST_TYPES,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
} from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import { getLobbyMvp } from "helpers/raid";
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
		const allRewards = await Promise.all(
			keys.map(async (key) => {
				const rewards = { user_tag: lobby[key].user_tag } as R;
				const user = await getRPGUser({ user_tag: lobby[key].user_tag });
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
				const promises = [ initDrops(raid.loot.drop.default, raid, user, false) ];
				if (raid.loot.rare) {
					const mvpUserId = getLobbyMvp(lobby);
					let mvp;
					if (mvpUserId) {
						mvp = mvpUserId;
					}
					promises.push(
						initDrops(
							raid.loot.rare,
							raid,
							user,
							true,
							mvp ? lobby[mvp] : undefined
						)
					);
				}
				const [ defaultDrops, rareDrops ] = await Promise.all(promises);
				rewards.defaultDrops = defaultDrops || [];
				rewards.rareDrops = rareDrops || [];
				return rewards;
			})
		);

		const collections = allRewards
			.map((reward) => {
				const resp = clone(reward);
				resp.defaultDrops?.map((d) => delete d.name);
				resp.rareDrops?.map((d) => delete d.name);
				return [
					...(resp.defaultDrops || []),
					...(resp.rareDrops || []),
				] as CollectionCreateProps[];
			})
			.flat();

		await createCollection(collections);

		loggers.info(
			"raid.processRaidLoot: Distributing raid loot rewards: " +
        JSON.stringify(allRewards)
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

		if (!isEvent) {
			const options = {
				author,
				channel: {} as ChannelProp,
				client,
				extras: {
					characterId: randomElementFromArray(raid.raid_boss.map((b) => b.character_id)),
					raidRank: raid.stats.rawDifficulty.toLowerCase(),
					raidId: raid.id,
					lobby: raid.lobby
				}
			};
			await Promise.all([
				validateAndCompleteQuest({
					user_tag: author.id,
					type: QUEST_TYPES.RAID_CHALLENGE,
					level: 0,
					options
				}),
				validateAndCompleteQuest({
					type: QUEST_TYPES.RAID_CARRY,
					user_tag: author.id,
					level: 0,
					options
				})
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
		raid.loot.gamePoints && raid.loot.gamePoints > 0 ? `\n__${raid.loot.gamePoints}__ Game Point(s)` : ""
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
	const leechers = Object.keys(raid.lobby)
		.map((i) => Number(i))
		.filter(
			(x) =>
				raid.lobby[x].total_damage <=
        Math.floor(raid.stats.original_strength * 0.12)
		);
	if (isRare) {
		array = array.filter((item) => {
			if (leechers.length > 0) {
				const leecher = leechers.find((l) => raid.lobby[l].user_id === user.id);
				if (leecher) {
					return false;
				}
			}
			let rate = item.rate || 10;
			if (mvp && user.id === mvp.user_id && !item.isStaticDropRate) {
				rate = rate + 5;
			}
			if ((user.is_premium || user.is_mini_premium) && !item.isStaticDropRate) {
				rate = rate + 10;
			}
			const dropChance = [ rate, 100 - rate ];
			const ratebool = [ true, false ];
			return ratebool[probability(dropChance)];
		});
	}
	const result = array.map((item) => {
		return raid.raid_boss
			.map((boss) =>
				Array(item.number)
					.fill("")
					.map(
						(_) =>
							({
								character_id: boss.character_id,
								character_level: STARTER_CARD_LEVEL,
								exp: STARTER_CARD_EXP,
								r_exp: STARTER_CARD_R_EXP,
								is_item: false,
								is_on_market: false,
								rank: item.rank,
								rank_id: item.rank_id,
								user_id: user.id,
								name: boss.name,
								is_on_cooldown: false,
								is_tradable: true,
							} as CollectionCreateProps & { name?: string })
					)
			)
			.flat();
	});

	return result.flat();
}
