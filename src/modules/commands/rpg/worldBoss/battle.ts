import { SingleCanvasReturnType } from "@customTypes/canvas";
import {
	CollectionCreateProps,
	CollectionProps,
} from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { CrateProps } from "@customTypes/crates";
import { RaidProps } from "@customTypes/raids";
import { WorldBossBattleProps } from "@customTypes/raids/worldBoss";
import { createCollection } from "api/controllers/CollectionsController";
import { deleteRaid } from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import {
	finishWorldBossEvent,
	getWorldBossRaid,
	processWorldBossRewards,
} from "api/controllers/WorldBossController";
import { Canvas } from "canvas";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import emoji from "emojis/emoji";
import {
	getRemainingHoursAndMinutes,
	getRemainingTimer,
	numericWithComma,
} from "helpers";
import { addTeamEffectiveness, prepareHPBar } from "helpers/adventure";
import {
	processHpBar,
	relativeDiff,
	validateFiveMinuteTimer,
} from "helpers/battle";
import { createBattleCanvas, createSingleCanvas } from "helpers/canvas";
import {
	DEFAULT_ERROR_TITLE,
	DOT,
	HIDE_VISUAL_BATTLE_ARG,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
	WORLD_BOSS_MANA_PER_BATTLE,
	WORLD_BOSS_MIN_LEVEL,
} from "helpers/constants/constants";
import { DMUser } from "helpers/directMessages";
import { prepareRaidBossBase } from "helpers/raid";
import { ranksMeta } from "helpers/constants/rankConstants";
import { validateAndPrepareTeam } from "helpers/teams";
import loggers from "loggers";
import GA4 from "loggers/googleAnalytics";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { getTTL } from "modules/cooldowns/channels";
import { titleCase } from "title-case";
import { simulateBattle } from "../adventure/battle/battle";
import * as battleInChannel from "../adventure/battle/battlesPerChannelState";
import { fetchWorldBossLeaderboardFields } from "./leaderboard";

export const battleWB = async ({
	context,
	options,
	args,
	client,
}: BaseProps) => {
	try {
		const { author } = options;
		const wbAtkTimerKey = "worldboss-attack";
		const ttl = await getTTL(author.id, wbAtkTimerKey);
		const ttlDt = new Date();
		if (ttl > 0) {
			const { remainingHours, remainingMinutes } = getRemainingHoursAndMinutes(
				ttlDt.setSeconds(ttlDt.getSeconds() + ttl)
			);
			if (remainingMinutes <= 0 && remainingHours <= 0) {
				clearCooldown(author.id, wbAtkTimerKey);
			}
			context.channel?.sendMessage(
				`Summoner **${author.username}**, You can Attack in: ` +
          `**\`\`${remainingHours} hours ${remainingMinutes} minutes\`\`**`
			);
			return;
		} else {
			clearCooldown(author.id, wbAtkTimerKey);
		}
		let inBattle = await getCooldown(author.id, "mana-battle");
		if (inBattle) {
			await validateFiveMinuteTimer({
				timestamp: inBattle.timestamp,
				key: `cooldown::mana-battle-${author.id}`,
			});
			context.channel?.sendMessage("Your battle is still in progress");
			return;
		}
		const battles = battleInChannel.validateBattlesInChannel(
			context.channel?.id || ""
		);
		if (battles === undefined) return;
		const [ raid, user ] = await Promise.all([
			getWorldBossRaid({ is_start: true }),
			getRPGUser({ user_tag: author.id }),
		]);
		if (!user) return;
		if (!user.selected_team_id) {
			context.channel?.sendMessage("Please select a valid Team!");
			return;
		}
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (user.level < WORLD_BOSS_MIN_LEVEL) {
			embed.setDescription(
				`Summoner **${author.username}**, ` +
          `You must be atleast level __${WORLD_BOSS_MIN_LEVEL}__ to participate in World Boss Challenges.`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (!raid) {
			embed.setDescription(
				`Summoner **${author.username}**, the World Boss Challenge either does not exist or has not started. ` +
          "Check back later to attack the World Boss."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (user.mana < WORLD_BOSS_MANA_PER_BATTLE) {
			embed.setDescription(
				`Summoner **${author.username}**, You do not have sufficient ` +
          `**Mana** to Attack! **__[${user.mana} / ${WORLD_BOSS_MANA_PER_BATTLE}]__**`
			);
			context.channel?.sendMessage(embed);
			return;
		}

		const playerStats = await validateAndPrepareTeam(
			user.id,
			user.user_tag,
			user.selected_team_id,
			context.channel
		);
		if (!playerStats) return;

		const enemyStats = prepareRaidBossBase(raid, false);
		enemyStats.totalStats.strength = raid.stats.remaining_strength;
		enemyStats.totalStats.originalHp = raid.stats.remaining_strength;
		const {
			playerStats: effectiveStats,
			opponentStats: opponentEffectiveStats,
		} = addTeamEffectiveness({
			cards: playerStats.stats.cards,
			enemyCards: enemyStats.cards,
			playerStats: playerStats.stats.totalStats,
			opponentStats: enemyStats.totalStats,
		});
		playerStats.stats.totalStats = effectiveStats;
		enemyStats.totalStats = opponentEffectiveStats;
		enemyStats.isBot = true;

		inBattle = await getCooldown(author.id, "mana-battle");
		if (inBattle) {
			context.channel?.sendMessage("Your battle is still in progress");
			return;
		}
		const multiplier = 1;

		const hideBt = (args.shift() || "").toLowerCase();
		setCooldown(author.id, "mana-battle", 60 * 5);
		const result = await simulateBattle({
			context,
			playerStats: playerStats.stats,
			enemyStats,
			title: "__World Boss Battle__",
			isRaid: true,
			options: { hideVisualBattle: hideBt === HIDE_VISUAL_BATTLE_ARG ? true : false, },
			multiplier,
		});
		clearCooldown(author.id, "mana-battle");
		GA4.customEvent("battle", {
			category: "world_boss",
			label: author.id,
			action: "battle"
		});
		if (!result) {
			context.channel?.sendMessage(
				"Unable to process battle, please try again later"
			);
			return;
		}
		result.totalDamage = Math.ceil((result.totalDamage || 0) * 5);
		processWorldBossRewards({
			raid,
			user,
			channel: context.channel,
			damageDealt: result.totalDamage || 0,
			cb: async ({
				updatedRaidObj,
				cards,
				totalGoldLooted,
				soulsLooted,
				crateLooted,
			}) => {
				const bossLives = updatedRaidObj.stats.battle_stats.energy;
				if (!bossLives || bossLives <= 0) {
					updatedRaidObj.stats.remaining_strength = 0;
					// Del Raid - DM Guilds & Give bonus to top 10
					context.channel?.sendMessage(
						"**Congratulations Summoner! World Boss has been defeated!**"
					);
					const cids = raid.raid_boss.map((b) => b.character_id);

					const [ resp ] = await Promise.all([
						fetchWorldBossLeaderboardFields(new Date(raid.created_at || "")),
						deleteRaid({ id: raid.id }),
						finishWorldBossEvent(cids),
					]);
					const bossDefeatEmbed = createEmbed(author, client)
						.setTitle("World Boss Defeated!")
						.setDescription(
							"Congratulations on defeating the World Boss " +
                `**Level ${raid.stats.battle_stats.boss_level}**\n\n` +
                `**Summoner ${author.username} has dealt the final blow to the World Boss!**\n\n`
							// "Bonus Rewards will be distributed to Top 10 Players."
						);

					if (resp?.fields) {
						bossDefeatEmbed.setFields(resp.fields);
					}
					sendTopWinnerRewards({
						client,
						data: resp?.rawResult || [],
						raid: updatedRaidObj,
					});
					// PublishMessageToAllGuilds({
					// 	client,
					// 	content: bossDefeatEmbed
					// });
				} else {
					setCooldown(author.id, wbAtkTimerKey, 60 * 60 * 4);
				}
				prepareAndSendResult({
					author,
					client,
					channel: context.channel,
					raid: updatedRaidObj,
					cards,
					totalGoldLooted,
					damageDealt: result.totalDamage || 0,
					soulsLooted,
					crateLooted,
				});
				return;
			},
		});
		return;
	} catch (err) {
		loggers.error("rpg.worldBoss.battle.battleWB: ERROR", err);
		return;
	}
};

type S = {
  data: WorldBossBattleProps[];
  client: Client;
  raid: RaidProps;
};
const sendTopWinnerRewards = async ({ data, client, raid }: S) => {
	try {
		const collectionData = data
			.map((user) => {
				return raid.raid_boss
					.map((boss) => {
						return Array(10)
							.fill(0)
							.map(() => {
								return {
									user_id: user.user_id,
									character_id: boss.character_id,
									r_exp: STARTER_CARD_R_EXP,
									exp: STARTER_CARD_EXP,
									character_level: STARTER_CARD_LEVEL,
									is_item: false,
									is_tradable: true,
									is_on_cooldown: false,
									rank: "divine",
									rank_id: ranksMeta.divine.rank_id,
								} as CollectionCreateProps;
							});
					})
					.flat();
			})
			.flat();
		await createCollection(collectionData);
		const rewardEmbed = createEmbed(undefined, client)
			.setTitle("World Boss Defeated!")
			.setDescription(
				"Congratulations on defeating the world boss!\n" +
          "You were one of the Top 10 highest damage dealers and received bonus rewards." +
          `\n\n**__Bonus Rewards__**\n${DOT} __10x__ **Divine** cards of ` +
          `**${raid.raid_boss.map((b) => titleCase(b.name)).join(", ")}**`
			);
		data.map((item) => DMUser(client, rewardEmbed, item.user_tag));
	} catch (err) {
		return;
	}
};

type R = {
  author: BaseProps["options"]["author"];
  client: BaseProps["client"];
  raid: RaidProps;
  damageDealt: number;
  cards: CollectionProps[];
  totalGoldLooted: number;
  channel: BaseProps["context"]["channel"];
  crateLooted?: CrateProps;
  soulsLooted: number;
};
const prepareAndSendResult = async ({
	author,
	client,
	channel,
	raid,
	damageDealt,
	cards,
	totalGoldLooted,
	soulsLooted,
	crateLooted,
}: R) => {
	const damageDiff = relativeDiff(
		raid.stats.remaining_strength,
		raid.stats.original_strength,
		8
	);
	const overAllStats = {
		health: prepareHPBar(8),
		strength: raid.stats.remaining_strength,
	};
	const fakeHp = processHpBar(overAllStats, damageDiff).health;
	let bossCanvas: SingleCanvasReturnType | Canvas | undefined;
	if (raid.raid_boss.length === 1) {
		bossCanvas = await createSingleCanvas(raid.raid_boss[0], false);
	} else {
		bossCanvas = await createBattleCanvas(raid.raid_boss, {
			isSingleRow: true,
			version: "small",
		});
	}
	if (!bossCanvas) {
		channel?.sendMessage(
			"Your battle has been processed, but we were not able to show the result."
		);
		return;
	}

	const extradrops = cards.filter((c) => ![ 2, 3 ].includes(c.rank_id));
	const bossNames = raid.raid_boss.reduce((acc, r) => {
		acc[r.character_id] = r;
		return acc;
	}, {} as any);
	const extraCardLoot = extradrops.reduce((acc, r) => {
		const cname = bossNames[r.character_id].name || "No Name";
		acc[r.rank] = {
			count: ((acc[r.rank] || {}).count || 0) + 1,
			characters: { [r.character_id]: titleCase(cname) },
		};
		return acc;
	}, {} as { [key: string]: { count: number; characters: { [i: number]: string } } });

	const dt = new Date();
	const nextAtkTimestamp = dt.setHours(dt.getHours() + 4);

	const embed = createEmbed(author, client)
		.setTitle(`${emoji.dance} Total Damage Dealt`)
		.setDescription(
			`**Summoner ${author.username}, you have dealt:**` +
        `\n**Energy (Lives):** ${raid.stats.battle_stats.energy || 0} ${
        	emoji.hp
        }` +
        `\n\n**__${numericWithComma(damageDealt)}__** Damage to World Boss` +
        `\n\n**${numericWithComma(
        	raid.stats.remaining_strength
        )} / ${numericWithComma(raid.stats.original_strength)} ${
        	emoji.hp
        }**\n` +
        `${fakeHp.join("")}\n\n**__Rewards__**\n${DOT} __${numericWithComma(
        	totalGoldLooted
        )}__ Total Gold Looted ${emoji.gold}` +
        `${
        	soulsLooted > 0
        		? `\n${DOT} __${soulsLooted}x__ Souls ${emoji.soul}`
        		: ""
        }` +
        `${
        	crateLooted
        		? `\n${DOT} __1x__ **${titleCase(
        			crateLooted?.category || "No Name"
        		)}** Crate`
        		: ""
        }` +
        `\n${DOT} __30x__ Platinum of **${raid.raid_boss
        	.map((b) => titleCase(b.name))
        	.join(", ")}**` +
        `${Object.keys(extraCardLoot).map((key) => {
        	return `\n${DOT} __${extraCardLoot[key].count}x__ ${titleCase(
        		key
        	)} of **${Object.keys(extraCardLoot[key].characters)
        		.map((k: any) => extraCardLoot[key].characters[k])
        		.join(", ")}**`;
        })}\n\n**Next Attack: ${getRemainingTimer(nextAtkTimestamp)}**`
		)
		.setHideConsoleButtons(true);

	channel?.sendMessage(embed);
	return;
};
