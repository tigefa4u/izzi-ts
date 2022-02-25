import { CharacterCanvasProps } from "@customTypes/canvas";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { RaidActionProps, RaidStatsProps } from "@customTypes/raids";
import { getRandomCard } from "api/controllers/CardsController";
import { createRaid, getUserRaidLobby } from "api/controllers/RaidsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { Canvas } from "canvas";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { randomElementFromArray, randomNumber } from "helpers";
import { createBattleCanvas } from "helpers/adventure";
import { createSingleCanvas } from "helpers/canvas";
import { DEFAULT_ERROR_TITLE, PERMIT_PER_RAID } from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import { prepareTotalOverallStats } from "helpers/teams";
import loggers from "loggers";
import { getCooldown, sendCommandCDResponse, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { prepareInitialLobbyMember, prepareRaidBossEmbedDesc } from "..";
import { computeRank } from "../computeBoss";

export const spawnRaid = async ({
	context, options, client, args, isEvent 
}: RaidActionProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const currentRaid = await getUserRaidLobby({ user_id: user.id });
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (currentRaid) {
			embed.setDescription(`You are already in a ${
				isEvent ? "Event" : "Raid"
			} Challenge! Type \`\`${
				isEvent ? "ev" : "rd"
			} bt\`\` to fight the ${isEvent ? "event" : "raid"} boss!`);

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
			embed.setDescription(`You do not have enough Permit(s) to spawn a ${
				isEvent ? "Event" : "Raid"
			} Boss! __${user.raid_pass} / ${PERMIT_PER_RAID}__`);

			context.channel?.sendMessage(embed);
			return;
		}
		const difficulty = args.shift();
		const computedBoss = computeRank(difficulty, isEvent);
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
		const raidBosses = await Promise.all(Array(computedBoss.bosses).fill(0).map(async () => {
			const rank = randomElementFromArray(computedBoss.rank);
			const level = randomNumber(computedBoss.level[0], computedBoss.level[1]);
			const card = await getRandomCard({
				is_logo: false,
				rank,
				is_event: isEvent,
				is_random: true
			}, 1);
			if (!card) return;
			const raidBoss = card[0];
			raidBoss.character_level = level;
			return {
				...raidBoss,
				character_id: 0,
				copies: 1,
				user_id: 0,
				is_on_market: false,
				is_item: false,
				item_id: 0,
				exp: 1,
				r_exp: 1,
				souls: 1,
				rank_id: 0
			};
		})) as CollectionCardInfoProps[];
		const stats = await prepareTotalOverallStats({
			collections: raidBosses,
			isBattle: false 
		});
		if (!stats) {
			throw new Error("Unable to prepare raid boss stats");
		}
		const dt = new Date();
		const reducedLevel = raidBosses.reduce((acc, r) => {
			acc.character_level = acc.character_level + r.character_level;
			return acc;
		}, { character_level: 0 } as { character_level: number });

		const totalBossLevel: number = reducedLevel.character_level;
		const raidStats = {
			battle_stats: {
				boss_level: totalBossLevel,
				bosses: computedBoss.bosses,
				power_level: stats.totalPowerLevel,
				stats: stats.totalOverallStats
			},
			remaining_strength: stats.totalOverallStats.strength * (totalBossLevel * 2),
			original_strength: stats.totalOverallStats.strength * (totalBossLevel * 2),
			difficulty: computedBoss.difficulty,
			timestamp: dt.setHours(dt.getHours() + 1)
		} as RaidStatsProps;
		let lobby = {};
		if (isPrivate) {
			lobby = prepareInitialLobbyMember(user.id, user.user_tag, user.username, user.level, true);
		}
		const raid = await createRaid({
			stats: raidStats,
			lobby: lobby,
			is_start: false,
			is_event: isEvent,
			is_private: isPrivate,
			raid_boss: JSON.stringify(raidBosses),
			loot: computedBoss.loot
		});
		if (!raid) return;
		user.raid_pass = user.raid_pass - PERMIT_PER_RAID;
		updateRPGUser({ user_tag: user.user_tag }, { raid_pass: user.raid_pass });
		setCooldown(
			author.id,
			CDKey,
			user.is_premium ? 9000 : 60 * 60 * 3
		);
		let bossCanvas: Canvas | undefined;
		if (isEvent) {
			bossCanvas = await createSingleCanvas(raidBosses[0], false);
		} else {
			bossCanvas = await createBattleCanvas(raidBosses, { isSingleRow: true });
		}

		const raidEmbed = createEmbed(author, client)
			.setTitle(`Raid ID: ${raid.id}`);
		if (!bossCanvas) {
			raidEmbed.setDescription("A Raid boss has been spawned, but we could not DM you the details! " +
            `Use \`\`${isEvent ? "ev" : "rd"} ${isPrivate ? " view`` to view the raid boss" : 
            	` join ${raid.id} to take on this raid boss!`}`);
			context.channel?.sendMessage(raidEmbed);
			return;
		}
		const attachment = createAttachment(bossCanvas.createJPEGStream(), "boss.jpg");

		embed.setTitle(`${emoji.warning} Raid Spawned! ${emoji.warning} [${titleCase(computedBoss.difficulty)}]`)
			.setDescription(prepareRaidBossEmbedDesc(raid, isEvent))
			.setImage("attachment://boss.jpg")
			.attachFiles([ attachment ]);

		let footerDesc = `use ${isEvent ? "ev" : "rd"} join ${raid.id} to take on this ${
			isEvent ? "Event" : "Raid"
		} Boss Challenge! If this spawn isn't claimed in an hour it will despawn.`;
		if (isPrivate) {
			footerDesc = `You have automatically joined this ${
				isEvent ? "event" : "raid"
			} challenge! Invite others to join your conquest using ${
				isEvent ? "ev" : "rd"
			} invite <@user>\nLobby Code: ${raid.id}`;
		}

		embed.setFooter({ text: footerDesc });
		DMUser(client, embed, author.id);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.actions.spawnRaid(): something went wrong", err);
		return;
	}
};
