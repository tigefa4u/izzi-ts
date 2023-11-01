import { OverallStatsProps } from "@customTypes";
import { SingleCanvasReturnType } from "@customTypes/canvas";
import { CardParams } from "@customTypes/cards";
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
import { taskQueue } from "handlers/taskQueue/gcp";
import { randomNumber } from "helpers";
import { createSingleCanvas, createBattleCanvas } from "helpers/canvas";
import { OS_LOG_CHANNELS } from "helpers/constants/channelConstants";
import {
	D1_RANKS,
	D2_RANKS,
	DEFAULT_ERROR_TITLE,
	HIGH_LEVEL_RAIDS,
	IMMORTAL_RAIDS,
	MIN_LEVEL_FOR_HIGH_RAIDS,
	MIN_RAID_USER_LEVEL,
	PERMIT_PER_RAID,
	TAXPAYER_RETURN_PERCENT,
	TAX_PAYER_RAID_PITY_THRESHOLD,
} from "helpers/constants/constants";
import { DMUser } from "helpers/directMessages";
import { RankProps } from "helpers/helperTypes";
import { statMultiplier } from "helpers/raid";
import { prepareTotalOverallStats } from "helpers/teams";
import loggers from "loggers";
import {
	getCooldown,
	sendCommandCDResponse,
	setCooldown,
} from "modules/cooldowns";
import { titleCase } from "title-case";
import { clone, DATE_OPTIONS } from "utility";
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
	LevelAndPLBonusDropRateProps,
	PLBonusDropRate,
	levelBonusForFragments,
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

const calculateDropRateByBossLevelAndPL = (
	level: number,
	loot: RaidLootProps,
	rank: RankProps,
	pl: number
) => {
	let category = "d3" as keyof ComputedCategoryProps;
	if (D2_RANKS.includes(rank)) {
		category = "d2";
	} else if (D1_RANKS.includes(rank)) {
		category = "d1";
	}
	let rate = 0;
	let bonusFragments = 0;
	const levelPercent = (level / computedCategoryData[category].maxlevel) * 100;
	const percentToLoop = Object.keys(levelBonusDropRate);
	for (const percent of percentToLoop) {
		const key = percent as keyof LevelAndPLBonusDropRateProps;
		if (levelPercent <= +percent) {
			rate = Number(
				levelBonusDropRate[key].toFixed(2)
			);
			bonusFragments = Number(
				levelBonusForFragments[key].toFixed(2)
			);
			break;
		}
	}

	if (bonusFragments > 0 && loot.drop.darkZone) {
		loot.drop.darkZone.fragments = loot.drop.darkZone.fragments + bonusFragments;
	}

	loggers.info("spawn.calculateDropRateByBossLevel: bonus drop rate", rate);
	if (rate > 0) {
		loot.rare?.map((drop) => {
			if (!drop.isStaticDropRate) {
				drop.rate = (drop.rate || 1) + rate;
			}
		});
		/**
     * Extra cards are ultra rare (myth) hence,
     * consider raid PL to boost drop rate instead of level.
     * This logic is commented since it makes it possible
     * for easy raid to have higher drop rate % than immo
     */
		// loot.extraCards?.map((drop) => {
		// 	if (!drop.isStaticDropRate) {
		// 		drop.rate = (drop.rate || 1) + rate;
		// 	}
		// });
	}

	/**
   * Boost mythical drop rate based on boss PL
   */
	let plRate = 0;
	const pltoLoop = Object.keys(PLBonusDropRate);
	for (const power of pltoLoop) {
		if (pl <= +power) {
			plRate = Number(PLBonusDropRate[power].toFixed(2));
			break;
		}
	}
	if (plRate > 0) {
		loot.extraCards?.map((drop) => {
			if (!drop.isStaticDropRate) {
				drop.rate = (drop.rate || 1) + plRate;
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

	/**
   * Pre-calculating PL & stats due to immo raids
   * having 1.45 multiplier to stats
   */
	let pl = stats.totalOverallStats.strength;
	Object.keys(stats.totalOverallStats).forEach((key) => {
		if ([ "vitality", "dexterity", "intelligence", "defense" ].includes(key)) {
			const k = key as keyof OverallStatsProps;
			stats.totalOverallStats[k] = Math.round(
				(stats.totalOverallStats[k] || 1) *
          statMultiplier[computedBoss.difficulty.toLowerCase()]
			);

			pl = pl + (stats.totalOverallStats[k] || 0);
		}
	});

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
	const computedLoot = calculateDropRateByBossLevelAndPL(
		totalBossLevel,
		computedBoss.loot,
		raidBosses[0].rank,
		pl
	);

	const raidStats = {
		battle_stats: {
			boss_level: totalBossLevel,
			bosses: computedBoss.bosses,
			power_level: pl,
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
	customSpawnParams = {},
	darkZoneSpawn = false,
}: C & {
  customSpawnParams?: CardParams;
  darkZoneSpawn?: boolean;
}) => {
	const computedLevel = randomNumber(
		computedBoss.level[0],
		computedBoss.level[1]
	);
	const params: any = {
		is_logo: false,
		rank: computedBoss.rank,
		is_event: isEvent,
		is_random: true,
		...customSpawnParams,
	};
	if (isEvent) {
		params.is_random = false;
	}
	let limit = computedBoss.bosses;
	if ((character_id || []).length > 0) {
		params.character_id = character_id;
		limit = character_id?.length || 1;
	}
	if (
		computedBoss.loot.drop.default &&
    Array.isArray(computedBoss.loot.drop.default)
	) {
		computedBoss.loot?.drop?.default?.map((d) => {
			d.number = Math.floor(d.number / limit);
		});
	}
	if (computedBoss.loot.rare) {
		computedBoss.loot.rare?.map((r) => {
			const rank = r.rank as keyof ComputedCategoryProps[
        | "d3"
        | "d2"
        | "d1"]["numberOfCards"];
			// Make this change if you decide to add more ranks
			if (computedBoss.extras?.numberOfCards[rank]) {
				// if (!r.isStaticDropRate) {
				r.rate = (r.rate || 0) + computedBoss.extras.numberOfCards[rank].rate;
				r.rate = Number((r.rate || 0).toFixed(2));
				// }
				r.number = Math.floor(
					computedBoss.extras.numberOfCards[rank].cards / limit
				);
			}
		});
	}
	if (computedBoss.loot.extraCards) {
		computedBoss.loot.extraCards?.map((r) => {
			const rank = r.rank as keyof ComputedCategoryProps[
        | "d3"
        | "d2"
        | "d1"]["numberOfCards"];
			// Make this change if you decide to add more ranks
			if (computedBoss.extras?.numberOfCards[rank]) {
				// if (!r.isStaticDropRate) {
				r.rate = (r.rate || 0) + computedBoss.extras.numberOfCards[rank].rate;
				r.rate = Number((r.rate || 0).toFixed(2));
				// }
				r.number = Math.floor(
					computedBoss.extras.numberOfCards[rank].cards / limit
				);
			}
		});
	}
	const cards = await getRandomCard(params, limit);
	if (!cards || cards.length <= 0) {
		throw new Error("Could not fetch random cards for raid spawn");
	}
	const raidBosses = cards.map((c) => {
		c.character_level = Math.floor(computedLevel / limit);
		/**
     * Boosting PL since 1 raid boss is kinda too easy
     */
		if (c.character_level < 800 && cards.length <= 1) {
			c.character_level = Math.floor(c.character_level * 1.25);
		}
		return {
			...c,
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
			series: c.series,
		} as CollectionCardInfoProps & { series?: string };
	});

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
			(b) => `${b.name}, ${b.rank}, ${b.type}, ${b.series}, ${b.abilityname}`
		)}, ${raidStats.difficulty.toLowerCase()}`,
		is_dark_zone: darkZoneSpawn
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
	external_character_ids,
	customSpawn,
	customSpawnParams,
	darkZoneSpawn = false,
	cb,
}: RaidActionProps & { cb?: () => void }) => {
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
		if (isEvent && user.level < MIN_RAID_USER_LEVEL) {
			context.channel?.sendMessage(
				`You must be atleast level __${MIN_RAID_USER_LEVEL}__ ` +
          "to be able to spawn or join Event Raids."
			);
			return;
		}
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
		const computedBoss = computeRank(difficulty, isEvent, false, user.level, { isDarkZone: darkZoneSpawn });
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

		let character_ids;

		/**
     * Raid Pity - spawn a chara from wishlist
     * This is related to market tax. Check `tax.ts`
     * for more info.
     *
     * Allow only 1 character to be spawned.
     */
		if (!customSpawn && !isEvent) {
			character_ids = await checkRaidPity(user);
		} else if (external_character_ids && customSpawn) {
			character_ids = external_character_ids;
		}

		const { raid, raidBosses } = await createRaidBoss({
			lobby,
			computedBoss,
			isEvent,
			isPrivate,
			character_id: character_ids,
			customSpawnParams,
			darkZoneSpawn
		});
		if (!raid) return;

		if (!spawnImmunity.includes(author.id))
			setCooldown(
				author.id,
				CDKey,
				user.is_premium || user.is_mini_premium ? 9000 : 60 * 60 * 3
			);
		if (cb) cb();
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

		taskQueue("log-raid-spawn", {
			message: `Server: ${context.guild?.name || "Unknown"} (${
				context.guild?.id || "Unknown"
			}) ${author.username} (${author.id}) has spawned a${
				customSpawn ? " custom" : darkZoneSpawn ? ` Dark Zone ${emoji.fragments}` : ""
			} raid. ${new Date().toLocaleDateString("en-us", DATE_OPTIONS)}`,
			channelId: OS_LOG_CHANNELS.RAID_SPAWN,
		});
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.actions.spawnRaid: ERROR", err);
		return;
	}
};
