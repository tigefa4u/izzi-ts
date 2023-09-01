import { AuthorProps, ChannelProp } from "@customTypes";
import { BattleStats } from "@customTypes/adventure";
import { DungeonProps } from "@customTypes/dungeon";
import { UserRankProps } from "@customTypes/userRanks";
import { getDGTeam, updateDGTeam } from "api/controllers/DungeonsController";
import { getUserRank } from "api/controllers/UserRanksController";
import { Client } from "discord.js";
import loggers from "loggers";
import { processDGLose, processDGWin } from "../rewards";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { emojiMap } from "emojis";
import { getUserBlacklist } from "api/controllers/UserBlacklistsController";
import { getGuildMember } from "api/controllers/GuildMembersController";
import { GuildMemberProps } from "@customTypes/guildMembers";
import { CONSOLE_BUTTONS, DEFAULT_ERROR_TITLE, PVP_XP } from "helpers/constants";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { viewBattleLogs } from "../../adventure/battle/viewBattleLogs";

const fetchAndUpdateDgLog = async (
	uid: string,
	log: DungeonProps["metadata"],
	channel: ChannelProp,
	showError?: boolean
) => {
	try {
		loggers.info(
			"dungeon.v2.rewards.fetchAndUpdateDgLog: updating dg logs from uid: " +
        uid
		);
		loggers.info(
			"dungeon.v2.rewards.fetchAndUpdateDgLog: updating with log data: ", log
		);
		const dgTeam = await getDGTeam(uid);
		if (!dgTeam && showError) {
			channel?.sendMessage(
				"Your DG battle was processed but we could not update your battle logs. :x:"
			);
			return;
		} else if (dgTeam) {
			dgTeam.metadata = {
				...dgTeam.metadata,
				...log,
			};
			return updateDGTeam(uid, { metadata: dgTeam.metadata });
		}
		return;
	} catch (err) {
		loggers.error("dungeon.v2.rewards.fetchAndUpdateDgLog: ERROR", err);
		return;
	}
};

type O = {
  result: BattleStats;
  author: AuthorProps;
  client: Client;
  channel: ChannelProp;
  opponentId: string;
  opponentUsername: string;
  guild_id: number;
  user_id: number;
  opponentUserId?: number;
};
export const processBattleOutcome = async ({
	result,
	opponentId,
	client,
	author,
	channel,
	opponentUsername,
	guild_id,
	user_id,
	opponentUserId
}: O) => {
	try {
		const _promises: any[] = [
			getUserRank({ user_tag: author.id }),
			getUserBlacklist({ user_tag: author.id }),
			getGuildMember({ user_id })
		];
		let opponentGuildMember: GuildMemberProps | undefined;
		if (opponentUserId && !result.isBot) {
			_promises.push(getGuildMember({ user_id: opponentUserId }).then((res) => opponentGuildMember = res));
		}
		const [ userRank, blacklist, guildMember ] = await Promise.all(_promises);
		if (!userRank) {
			channel?.sendMessage("Unable to process DG, please try again later");
			return;
		}
		if (blacklist && blacklist.length > 0) {
			channel?.sendMessage(`Summoner **${author.username}**, you have been blacklisted, ` +
            "your DG battle will not be processed. Please contact support.");
			return;
		}

		const errorEmbed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!guildMember) {
			errorEmbed.setDescription(`Summoner **${author.username}**, You must be in a ` +
			"Guild to participate in Ranked PvP. Your battle will not be processed.");
			channel?.sendMessage(errorEmbed);
			return;
		}
		let resultDesc = "";
		let outcomeDesc = "";
		let opponentUserRank: UserRankProps | undefined,
			computedUserRank = {} as UserRankProps;
		if (!result.isBot) {
			opponentUserRank = await getUserRank({ user_tag: opponentId });
		}
		const promises = [];
		loggers.info(
			"dungeon.v2.rewards.processBattleOutcome: processing dg outcome for user: ",
			{
        	author,
        	userRank,
        	opponentId,
        	isOpponentBot: result.isBot,
        	isVictory: result.isVictory,
			}
		);
		if (result.isVictory) {
			outcomeDesc = `Congratulations summoner **${author.username}**, You ` +
            `have defeated **${opponentUsername}** in Dungeon Ranked Battle! ${emoji.celebration}`;
			promises.push(
				processDGWin(userRank, author.id, guildMember.guild_id).then((_dgWin) => {
					resultDesc = _dgWin.desc;
					computedUserRank = _dgWin.userRank;
				})
			);
			if (!result.isBot && opponentUserRank) {
				// Interchange points for season 2
				promises.push(
					processDGLose(opponentUserRank, opponentId, opponentGuildMember?.guild_id),
					fetchAndUpdateDgLog(
						author.id,
						{
							attacked: {
								user_tag: opponentId,
								username: opponentUsername,
								outcome: "win",
								rank: opponentUserRank.rank,
								points: PVP_XP.WIN
							},
						},
						channel,
						true
					),
					fetchAndUpdateDgLog(
						opponentId,
						{
							defended: {
								user_tag: author.id,
								username: author.username,
								outcome: "lose",
								rank: userRank.rank,
								points: PVP_XP.LOSS
							},
						},
						channel,
						false
					)
				);
			}
		} else {
			outcomeDesc = `Summoner **${author.username}**, You were defeated by ` +
            `**${opponentUsername}** in PvP Ranked Battle! ${emoji.cry}`;
			promises.push(
				processDGLose(userRank, author.id, guildMember?.guild_id).then((_dgLose) => {
					resultDesc = _dgLose.desc;
					computedUserRank = _dgLose.userRank;
				})
			);
			if (!result.isBot && opponentUserRank) {
				promises.push(
					processDGWin(opponentUserRank, opponentId, opponentGuildMember?.guild_id),
					fetchAndUpdateDgLog(
						author.id,
						{
							attacked: {
								user_tag: opponentId,
								username: opponentUsername,
								outcome: "lose",
								rank: opponentUserRank.rank,
								points: PVP_XP.LOSS
							},
						},
						channel,
						true
					),
					fetchAndUpdateDgLog(
						opponentId,
						{
							defended: {
								user_tag: author.id,
								username: author.username,
								outcome: "win",
								rank: userRank.rank,
								points: PVP_XP.WIN
							},
						},
						channel,
						false
					)
				);
			}
		}

		loggers.info(
			"dungeon.v2.rewards.processBattleOutcome: loading all promises"
		);
		await Promise.all(promises);

		const button = customButtonInteraction(
			channel,
			[{
				label: CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.label,
				params: { id: CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.id }
			}],
			author.id,
			({ id }) => {
				if (id === CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.id && result.simulation && result.attachments) {
					viewBattleLogs({
						simulation: result.simulation,
						authorId: author.id,
						attachments: result.attachments,
						channel
					})
				}
				return;
			},
			() => {
				return;
			}
		)

		const embed = createEmbed(author, client)
			.setTitle(
				result?.isVictory
					? `Victory ${emoji.celebration}!`
					: `Defeated ${emoji.cry}`
			)
			.setDescription(
				resultDesc +
          `\n${emojiMap(computedUserRank.rank)} ${emojiMap(
          	`${
          		computedUserRank.rank === "grand master"
          			? computedUserRank.rank
          			: "division"
          	}${computedUserRank.division}`
          )}` +
          `\n\nYou currently have __[${computedUserRank.exp} / ${computedUserRank.r_exp}]__`
			);

		channel?.sendMessage(outcomeDesc);
		channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("dungeon.v2.rewards.processBattleOutcome: ERROR", err);
		return;
	}
};
