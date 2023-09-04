import { SingleCanvasReturnType } from "@customTypes/canvas";
import { CollectionCardInfoProps } from "@customTypes/collections";
import {
	PrepareLootProps,
	RaidActionProps,
	RaidLobbyProps,
	RaidLootProps,
	RaidStatsProps,
} from "@customTypes/raids";
import { UserProps } from "@customTypes/users";
import { getRandomCard } from "api/controllers/CardsController";
import { getYearlyTaxPaid } from "api/controllers/MarketLogsController";
import { createRaid, getUserRaidLobby } from "api/controllers/RaidsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { getRandomCardFromWlist } from "api/controllers/WishlistsContorller";
import Cache from "cache";
import { Canvas } from "canvas";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { randomElementFromArray, randomNumber } from "helpers";
import { createSingleCanvas, createBattleCanvas } from "helpers/canvas";
import {
	D1_RANKS,
	D2_RANKS,
	DEFAULT_ERROR_TITLE,
	FODDER_RANKS,
	HIGH_LEVEL_RAIDS,
	IMMORTAL_RAIDS,
	MIN_LEVEL_FOR_HIGH_RAIDS,
	MIN_RAID_USER_LEVEL,
	PERMIT_PER_RAID,
	TAXPAYER_RETURN_PERCENT,
	TAX_PAYER_RAID_PITY_THRESHOLD,
} from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import { prepareTotalOverallStats } from "helpers/teams";
import loggers from "loggers";
import { getCooldown, sendCommandCDResponse, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { clone } from "utility";
import {
	prepareInitialLobbyMember,
	prepareRaidBossEmbedDesc,
	prepareRaidTimer,
} from "..";
import { computeRank } from "../computeBoss";
import {
	computedCategoryData,
	ComputedCategoryProps,
	levelBonusDropRate,
	LevelBonusDropRateProps,
} from "../prepareBaseLoot";

const spawnImmunity = [ "266457718942990337", "476049957904711682" ];
type C = {
  computedBoss: PrepareLootProps;
  isEvent: boolean;
  isPrivate: boolean;
  lobby: RaidLobbyProps;
  character_id?: number[];
};

const raidDivisions = {
	d2: {
		name: "D2",
		min: 5000,
		max: 8500,
		rate: randomNumber(2, 3),
	},
	d1: {
		name: "D1",
		min: 8501,
		max: 30000,
		rate: randomNumber(4, 5),
	},
};

const calculateDropRateByBossLevel = (
	level: number,
	loot: RaidLootProps,
	rank: string
) => {
	let category = "d3" as keyof ComputedCategoryProps;
	if (D2_RANKS.includes(rank)) {
		category = "d2";
	} else if (D1_RANKS.includes(rank)) {
		category = "d1";
	}
	let rate = 0;
	const levelPercent = (level / computedCategoryData[category].maxlevel) * 100;
	const percentToLoop = Object.keys(levelBonusDropRate);
	for (const percent of percentToLoop) {
		if (levelPercent <= +percent) {
			rate = Number(levelBonusDropRate[percent as keyof LevelBonusDropRateProps].toFixed(2));
			break;
		}
	}
	loggers.info("spawn.calculateDropRateByBossLevel: bonus drop rate", rate);
	if (rate > 0) {
		loot.rare?.map((drop) => {
			if (!drop.isStaticDropRate) {
				drop.rate = (drop.rate || 1) + rate;
			}
		});
	}

	loot.division = category;
	return loot;
};

export const computeRaidBossStats = async ({
	raidBosses,
	computedBoss,
}: {
  raidBosses: CollectionCardInfoProps[];
  computedBoss: C["computedBoss"];
}) => {
	const stats = await prepareTotalOverallStats({
		collections: clone(raidBosses),
		isBattle: false,
	});
	if (!stats) {
		throw new Error("Unable to prepare raid boss stats");
	}

	if (stats.totalOverallStats.originalHp === 0) {
		stats.totalOverallStats.originalHp = stats.totalOverallStats.strength;
	}
	const dt = new Date();
	const reducedLevel = raidBosses.reduce(
		(acc, r) => {
			acc.character_level = acc.character_level + r.character_level;
			return acc;
		},
    { character_level: 0 } as { character_level: number }
	);
	

	const totalBossLevel: number = reducedLevel.character_level;
	const computedLoot = calculateDropRateByBossLevel(
		totalBossLevel,
		computedBoss.loot,
		raidBosses[0].rank
	);

	const raidStats = {
		battle_stats: {
			boss_level: totalBossLevel,
			bosses: computedBoss.bosses,
			power_level: stats.totalPowerLevel,
			stats: stats.totalOverallStats,
		},
		remaining_strength: stats.totalOverallStats.strength * totalBossLevel,
		original_strength: stats.totalOverallStats.strength * totalBossLevel,
		difficulty: `${computedBoss.difficulty}${
			computedLoot.division ? ` ${computedLoot.division}` : ""
		}`,
		timestamp: dt.setHours(dt.getHours() + 1),
		rawDifficulty: computedBoss.difficulty,
	} as RaidStatsProps;

	return {
		raidStats,
		computedLoot,
	};
};

export const createRaidBoss = async ({
	computedBoss,
	isEvent,
	lobby,
	isPrivate,
	character_id,
}: C) => {
	const computedLevel = randomNumber(
		computedBoss.level[0],
		computedBoss.level[1]
	);
	const raidBosses = (await Promise.all(
		Array(computedBoss.bosses)
			.fill(0)
			.map(async (_, i) => {
				const rank = randomElementFromArray(computedBoss.rank);
				const params: any = {
					is_logo: false,
					rank,
					is_event: isEvent,
					is_random: true,
				};
				if (isEvent) {
					if (i === 0) {
						params.group_id = computedBoss.group_id;
					} else if (i === 1) {
						params.group_with = computedBoss.group_id;
					}
				}

				// Raid Pity system - spawn a raid from wishlist
				if (character_id && character_id.length > 0 && character_id[i]) {
					params.character_id = character_id[i];
				}
				const card = await getRandomCard(params, 1);
				if (!card || card.length <= 0) {
					return;
				}
				const raidBoss = card[0];
				raidBoss.character_level = Math.floor(computedLevel / computedBoss.bosses);
				return {
					...raidBoss,
					copies: 1,
					user_id: 0,
					is_on_market: false,
					is_item: false,
					item_id: 0,
					exp: 1,
					r_exp: 1,
					souls: 1,
					rank_id: 0,
					is_on_cooldown: false,
					is_tradable: true,
				};
			})
	)) as CollectionCardInfoProps[];

	const { raidStats, computedLoot } = await computeRaidBossStats({
		raidBosses,
		computedBoss,
	});
	const raid = await createRaid({
		stats: raidStats,
		lobby: lobby,
		is_start: false,
		is_event: isEvent,
		is_private: isPrivate,
		raid_boss: JSON.stringify(raidBosses),
		loot: computedLoot,
		filter_data: `${raidBosses.map(
			(b) => `${b.name}, ${b.rank}, ${b.type}`
		)}, ${raidStats.difficulty.toLowerCase()}`,
	});
	loggers.info("Created Raid with data -> ", raid);
	return {
		raid,
		raidBosses,
	};
};

const checkRaidPity = async (user: UserProps) => {
	try {
		const result = await getYearlyTaxPaid({ user_tag: user.user_tag });
		const total = Number(result?.sum || 0);
		const commission = Math.floor(total * TAXPAYER_RETURN_PERCENT);

		let taxReturns =
      commission -
      (user.metadata?.raidPityCount || 0) * TAX_PAYER_RAID_PITY_THRESHOLD;
		if (taxReturns < 0) taxReturns = 0;

		loggers.info("Total Tax Returns: ", taxReturns);
		// spawn a card from wishlist
		if (taxReturns >= TAX_PAYER_RAID_PITY_THRESHOLD) {
			// spawn a card from wishlist and update user
			const wlist = await getRandomCardFromWlist({
				user_tag: user.user_tag,
				is_referral_card: false,
				is_xenex_card: false,
			});
			if (wlist && wlist.length > 0 && wlist[0].is_random) {
				loggers.info("Spawning card from wishlist: ", wlist);
				await updateRPGUser(
					{ user_tag: user.user_tag },
					{
						metadata: {
							...(user.metadata || {}),
							raidPityCount: (user.metadata?.raidPityCount || 0) + 1,
						},
					}
				);
				return [ wlist[0].character_id ];
			}
		}

		return [];
	} catch (err) {
		loggers.error("raid.spawn.checkRaidPity: ERROR", err);
		return;
	}
};

export const spawnRaid = async ({
	context,
	options,
	client,
	args,
	isEvent,
}: RaidActionProps) => {
	try {
		const author = options.author;
		const [ user, rconfig ] = await Promise.all([
			getRPGUser({ user_tag: author.id }),
			Cache.get("rconfig::" + author.id),
		]);
		if (!user) return;
		const currentRaid = await getUserRaidLobby({ user_id: user.id });
		const embed = createEmbed(author).setTitle(DEFAULT_ERROR_TITLE);
		if (currentRaid) {
			embed.setDescription(
				`You are already in a ${
					isEvent ? "Event" : "Raid"
				} Challenge! Type \`\`${isEvent ? "ev" : "rd"} bt\`\` to fight the ${
					isEvent ? "event" : "raid"
				} boss!`
			);

			context.channel?.sendMessage(embed);
			return;
		}
		const CDKey = `${isEvent ? "event" : "raid"}-spawn`;
		const cd = await getCooldown(author.id, CDKey);
		if (cd) {
			sendCommandCDResponse(context.channel, cd, author.id, CDKey);
			return;
		}
		if (user.raid_pass < PERMIT_PER_RAID) {
			embed.setDescription(
				`You do not have enough Permit(s) to spawn a ${
					isEvent ? "Event" : "Raid"
				} Boss! __${user.raid_pass} / ${PERMIT_PER_RAID}__`
			);

			context.channel?.sendMessage(embed);
			return;
		}
		let difficulty = args.shift();
		if (rconfig && !difficulty) {
			const { difficulty: configDifficulty } = JSON.parse(rconfig);
			difficulty = configDifficulty;
		} else if (!difficulty) {
			difficulty = "e";
		}
		if (!difficulty) return;
		if (
			user.level < MIN_RAID_USER_LEVEL &&
      HIGH_LEVEL_RAIDS.includes(difficulty)
		) {
			context.channel?.sendMessage(
				`You must be atleast level __${MIN_RAID_USER_LEVEL}__ ` +
          "to be able to spawn or join __high level(Hard / Immortal)__ Raids."
			);
			return;
		} else if (
			user.level < MIN_LEVEL_FOR_HIGH_RAIDS &&
      IMMORTAL_RAIDS.includes(difficulty) &&
      !isEvent
		) {
			context.channel?.sendMessage(
				`You must be atleast level __${MIN_LEVEL_FOR_HIGH_RAIDS}__ ` +
          "to be able to spawn or join __Immortal__ Raids."
			);
			return;
		}
		const computedBoss = computeRank(difficulty, isEvent, false, user.level);
		if (!computedBoss) {
			context.channel?.sendMessage("Unable to spawn boss. Please try again");
			return;
		}
		const makePrivate: any = {
			"-p": true,
			"-private": true,
		};
		let isPrivate = makePrivate[args.shift() || ""];
		if (!isPrivate) isPrivate = false;
		let lobby = {};
		if (isPrivate) {
			lobby = prepareInitialLobbyMember(
				user.id,
				user.user_tag,
				user.username,
				user.level,
				true
			);
		}

		/**
     * Raid Pity - spawn a chara from wishlist
     * This is related to market tax. Check `tax.ts`
     * for more info.
     *
     * Allow only 1 character to be spawned.
     */
		const raidPityCids = await checkRaidPity(user);

		const { raid, raidBosses } = await createRaidBoss({
			lobby,
			computedBoss,
			isEvent,
			isPrivate,
			character_id: raidPityCids,
		});
		if (!raid) return;

		if (!spawnImmunity.includes(author.id))
			setCooldown(
				author.id,
				CDKey,
				user.is_premium || user.is_mini_premium ? 9000 : 60 * 60 * 3
			);
		let bossCanvas: SingleCanvasReturnType | Canvas | undefined;
		if (raidBosses.length === 1) {
			bossCanvas = await createSingleCanvas(raidBosses[0], false);
		} else {
			bossCanvas = await createBattleCanvas(raidBosses, {
				isSingleRow: true,
				version: "medium",
			});
		}

		const raidEmbed = createEmbed(author, client).setTitle(
			`Raid ID: ${raid.id}`
		);
		if (!bossCanvas) {
			raidEmbed.setDescription(
				"A Raid boss has been spawned, but we could not DM you the details! " +
          `Use \`\`${isEvent ? "ev" : "rd"} ${
          	isPrivate
          		? " view`` to view the raid boss"
          		: ` join ${raid.id} to take on this raid boss!`
          }`
			);
			context.channel?.sendMessage(raidEmbed);
			return;
		}
		const attachment = createAttachment(
			bossCanvas.createJPEGStream(),
			"boss.jpg"
		);

		embed
			.setTitle(
				`${emoji.warning} Raid Spawned! ${emoji.warning} [${titleCase(
					raid.stats.difficulty
				)}] ${prepareRaidTimer(raid)}`
			)
			.setDescription(prepareRaidBossEmbedDesc(raid, isEvent))
			.setImage("attachment://boss.jpg")
			.attachFiles([ attachment ]);

		let footerDesc = `use ${isEvent ? "ev" : "rd"} join ${
			raid.id
		} to take on this ${
			isEvent ? "Event" : "Raid"
		} Boss Challenge! If this spawn isn't claimed in an hour it will despawn.`;
		if (isPrivate) {
			footerDesc = `You have automatically joined this ${
				isEvent ? "event" : "raid"
			} challenge! Invite others to join your conquest using ${
				isEvent ? "ev" : "rd"
			} invite <@user>\nLobby Code: ${raid.id}`;
		}

		embed.setFooter({
			text: footerDesc,
			iconURL: author.displayAvatarURL(),
		});
		DMUser(client, embed, author.id);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.actions.spawnRaid: ERROR", err);
		return;
	}
};
