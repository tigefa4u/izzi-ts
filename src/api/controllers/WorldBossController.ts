import { ChannelProp, ResponseWithPagination } from "@customTypes";
import {
	CreateWorldBossBattleProps,
	WorldBossBattleProps,
} from "@customTypes/raids/worldBoss";
import {
	DEFAULT_ERROR_TITLE,
	PAGE_FILTER,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
	WORLD_BOSS_MANA_PER_BATTLE,
} from "helpers/constants";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as WorldBossBattles from "../models/WorldBossBattles";
import * as Raids from "../models/Raids";
import * as Cards from "../models/Cards";
import { RaidCreateProps, RaidProps } from "@customTypes/raids";
import { UserProps } from "@customTypes/users";
import { startTransaction } from "api/models/Users";
import { CollectionCreateProps, CollectionProps } from "@customTypes/collections";
import { probability } from "helpers";
import { createEmbed } from "commons/embeds";
import { setCooldown } from "modules/cooldowns";
import { CrateProps } from "@customTypes/crates";

export const createWorldBossBattle = async (
	data: CreateWorldBossBattleProps
) => {
	try {
		loggers.info("Create world boss battle with data: " + JSON.stringify(data));
		return WorldBossBattles.create(data);
	} catch (err) {
		loggers.error(
			"api.controllers.WorldBossController.createWorldBossBattle: ERROR",
			err
		);
		return;
	}
};

export const getWorldBossBattles = async (
	params: { user_tag?: string; fromDate?: Date; forLeaderboard?: boolean; },
	filter = PAGE_FILTER
): Promise<ResponseWithPagination<WorldBossBattleProps[]> | undefined> => {
	try {
		const result = await WorldBossBattles.get(
			params,
			await paginationParams({
				currentPage: filter.currentPage,
				perPage: filter.perPage,
			})
		);

		const pagination = await paginationForResult({
			data: result,
			query: filter,
		});
		return {
			data: result,
			metadata: pagination,
		};
	} catch (err) {
		loggers.error(
			"controllers.WorldBossController.getWorldBossBattles: ERROR",
			err
		);
		return;
	}
};

export const getWorldBossBattleLb = async (params: { fromDate: Date; }) => {
	try {
		return WorldBossBattles.getForLeaderboard(params);
	} catch (err) {
		loggers.error("controllers.WorldBossController.getWorldBossBattleLb: ERROR", err);
		return;
	}
};

export const createWorldBoss = async (data: RaidCreateProps) => {
	try {
		data.is_world_boss = true;
		loggers.info("Creating world boss with data: " + JSON.stringify(data));
		return Raids.create(data);
	} catch (err) {
		loggers.error(
			"controllers.WorldBossController.createWorldBoss: ERROR",
			err
		);
		return;
	}
};

export const getWorldBossRaid = async (params?: { is_start: boolean }) => {
	try {
		return Raids.getWorldBoss(params);
	} catch (err) {
		loggers.error(
			"controllers.WorldBossController.getWorldBossRaid: ERROR",
			err
		);
		return;
	}
};

export const getWorldBossToSpawn = async (params: { rank: string }) => {
	try {
		loggers.info("Fetching world boss card...");
		return Cards.getForWorldBoss(params);
	} catch (err) {
		loggers.error(
			"controllers.WorldBossController.getWorldBossToSpawn: ERROR",
			err
		);
		return;
	}
};

type CB = {
    cards: CollectionProps[];
    totalGoldLooted: number;
    updatedRaidObj: RaidProps;
    soulsLooted: number;
    crateLooted?: CrateProps;
}
export const processWorldBossRewards = async (params: {
  raid: RaidProps;
  user: UserProps;
  channel: ChannelProp;
  damageDealt: number;
  cb: (params: CB) => void;
}) => {
	try {
		const {
			raid, user, channel, cb, damageDealt 
		} = params;

		const embed = createEmbed();
		if (!damageDealt || isNaN(damageDealt) || damageDealt <= 0) {
			setCooldown(user.user_tag, "worldboss-attack", 60 * 60);
			await createWorldBossBattle({
				user_tag: user.user_tag,
				damage_dealt: 0,
				loot: { gold: 0 },
				boss_stats: raid.stats.battle_stats,
				character_id: raid.raid_boss[0].character_id
			});
			embed.setTitle("Total Damage Dealt")
				.setDescription(
					`**Summoner ${user.username}, you have dealt:**\n**__0__** Damage to the World Boss` +
                    "\n\nYou are not eligible to receive loot. " +
                    "You can attack again ``in 1 Hour``."
				);
			channel?.sendMessage(embed);
			return;
		}
		loggers.info("World boss rewards started processing...");
		const loot = raid.loot.drop.worldBoss;
		if (!loot) {
			throw new Error("Loot not found for World boss Raid: " + raid.id);
		}
		const dt = raid.created_at ? new Date(raid.created_at) : new Date();
		const { sum } = await WorldBossBattles.fetchTotalDamageDealt({
			fromDate: dt,
			user_tag: user.user_tag,
		});
		const _totalDamage = Number(sum || 0) + damageDealt;

		const bossHp = raid.stats.remaining_strength - damageDealt;
		const damagePercent = Math.floor((_totalDamage / bossHp) * 100);

		let totalGoldLooted = loot.gold;
		const attackerRewards = { gold: loot.gold } as Record<string, any>;
		const collectionData = await Promise.all(
			raid.raid_boss
				.map((boss) => {
					attackerRewards[boss.character_id] = {
						platinum: 6,
						gold: 6,
					};
					return [
						{
							rank: "platinum",
							rank_id: 3,
						},
						{
							rank: "gold",
							rank_id: 2,
						},
					]
						.map(({ rank, rank_id }) => {
							return Array(6)
								.fill(0)
								.map(
									(_) =>
										({
											is_item: false,
											is_on_cooldown: false,
											is_tradable: true,
											is_favorite: false,
											user_id: user.id,
											character_id: boss.character_id,
											character_level: STARTER_CARD_LEVEL,
											r_exp: STARTER_CARD_R_EXP,
											exp: STARTER_CARD_EXP,
											rank,
											rank_id,
										} as CollectionCreateProps)
								);
						})
						.flat();
				})
				.flat()
		);

		const extraLoot = loot.default.find(
			(item) => item.threshold <= damagePercent
		);

		let soulsLooted = 0;
		let crateLooted: any;
		if (extraLoot) {
			totalGoldLooted = totalGoldLooted + extraLoot.extraGold;
			attackerRewards.extraGold = extraLoot.extraGold;
			soulsLooted = extraLoot.souls;

			// loot crate
			const canLootCrate = [ true, false ][probability([ extraLoot.crateDropRate, 100 ])];
			if (canLootCrate) {
				crateLooted = extraLoot.crates;
			}

			raid.raid_boss.map((boss) => {
				const canGetExtraCards = [ true, false ][
					probability([ extraLoot.rate, 100 ])
				];
				if (canGetExtraCards) {
					attackerRewards[boss.character_id][extraLoot.rank] = extraLoot.number;
					attackerRewards.threshold = extraLoot.threshold;
					const extraDrops = Array(extraLoot.number)
						.fill(0)
						.map(
							(_) =>
								({
									is_item: false,
									is_on_cooldown: false,
									is_tradable: true,
									is_favorite: false,
									user_id: user.id,
									character_id: boss.character_id,
									character_level: STARTER_CARD_LEVEL,
									r_exp: STARTER_CARD_R_EXP,
									exp: STARTER_CARD_EXP,
									rank: extraLoot.rank,
									rank_id: extraLoot.rank_id,
								} as CollectionCreateProps)
						)
						.flat();
					collectionData.push(...extraDrops);
				}
			});
		}

		return startTransaction(async (trx) => {
			try {
				const bodyParams = {
					gold: trx.raw(`gold + ${totalGoldLooted}`),
					mana: trx.raw(`mana - ${WORLD_BOSS_MANA_PER_BATTLE}`),
				} as any;

				if (soulsLooted > 0) {
					bodyParams.souls = trx.raw(`souls + ${soulsLooted}`);
				}

				loggers.info(
					"[transaction] updating user with data: " +
            JSON.stringify({
            	gold: totalGoldLooted,
            	mana: WORLD_BOSS_MANA_PER_BATTLE,
            })
				);
				const updatedObj = await trx("users")
					.where({ user_tag: user.user_tag })
					.where("mana", ">=", WORLD_BOSS_MANA_PER_BATTLE)
					.update(bodyParams)
					.returning("*")
					.then((res) => res[0]);

				if (!updatedObj) {
					loggers.error(
						"[transaction] user update FAILED: Insufficient MANA",
						{}
					);

					embed.setTitle(DEFAULT_ERROR_TITLE)
						.setDescription(
							`Summoner **${user.username}**, You do not have sufficient mana to finish this battle.`
						);
					channel?.sendMessage(embed);
					trx.rollback();
					return;
				}

				if (crateLooted) {
					crateLooted = await trx("crates").insert({
						...crateLooted,
						user_tag: user.user_tag
					}, "*").then((res) => res[0]);

					if (!crateLooted) {
						channel?.sendMessage("We were not able to process your rewards, Please try again.");
						throw new Error("Unable to create crates");
					}
				}

				const updatedRaidObj = await trx("raids")
					.where({ id: raid.id })
					.update({
						stats: trx.raw(
							"jsonb_set(stats, '{remaining_strength}', to_jsonb((stats ->> " +
                            `'remaining_strength')::integer - ${damageDealt}))`
						),
					}).returning("*")
					.then((res) => res[0]);

				if (!updatedRaidObj) {
					channel?.sendMessage("Unable to process your battle, Please try again later. :x:");
					trx.rollback();
					return;
				}

				if (updatedRaidObj.stats.remaining_strength <= 0) {
					updatedRaidObj.stats.remaining_strength = updatedRaidObj.stats.original_strength;
					updatedRaidObj.stats.battle_stats.energy = updatedRaidObj.stats.battle_stats.energy - 1;
					await trx("raids").where({ id: raid.id }).update({ stats: updatedRaidObj.stats });
				}

				loggers.info(
					"[transaction] WB user update successful: data - " +
            JSON.stringify(updatedObj)
				);

				loggers.info(
					"[transaction] WB Create Collections with data: " +
            JSON.stringify(collectionData)
				);
				const collectionDataCreated = await trx("collections").insert(collectionData, "*");
				if (!collectionDataCreated) {
					channel?.sendMessage("We were not able to process your rewards, Please try again.");
					throw new Error("Unable to create Cards");
				}
				loggers.info("[transaction] WB collections created with data: " 
                + JSON.stringify(collectionDataCreated));
				const _worldBossBattleData = {
					user_tag: user.user_tag,
					loot: attackerRewards,
					character_id: raid.raid_boss[0].character_id,
					damage_dealt: damageDealt,
					boss_stats: raid.stats,
				};
				loggers.info(
					"[transaction] Creating world boss battle with loot data: " +
            JSON.stringify(_worldBossBattleData)
				);
				await trx("world_boss_battles").insert(_worldBossBattleData);

				loggers.info("[transaction] all transactions completed...");
				// Success CB
				cb({
					cards: collectionDataCreated,
					totalGoldLooted,
					updatedRaidObj,
					soulsLooted,
					crateLooted
				});
				return;
			} catch (err) {
				loggers.error(
					"WorldBossController.processWorldBossReward: transaction FAILED: ",
					err
				);
				return;
			}
		});
	} catch (err) {
		loggers.error(
			"controllers.WorldBossController.processWorldBossRewards: ERROR",
			err
		);
		return;
	}
};

export const finishWorldBossEvent = async (cids: number[]) => {
	try {
		return Cards.finishWbChallenge(cids);
	} catch (err) {
		loggers.error(
			"controllers.WorldBossController.finishWorldBossEvent: ERROR", err
		);
		return;
	}
};