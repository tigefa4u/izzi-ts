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
			"dungeon.v2.rewards.fetchAndUpdateDgLog: updating with log data: " +
        JSON.stringify(log)
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
};
export const processBattleOutcome = async ({
	result,
	opponentId,
	client,
	author,
	channel,
	opponentUsername,
}: O) => {
	try {
		const [ userRank, blacklist ] = await Promise.all([
			getUserRank({ user_tag: author.id }),
			getUserBlacklist({ user_tag: author.id })
		]);
		if (!userRank) {
			channel?.sendMessage("Unable to process DG, please try again later");
			return;
		}
		if (blacklist && blacklist.length > 0) {
			channel?.sendMessage(`Summoner **${author.username}**, you have been blacklisted, ` +
            "your DG battle will not be processed. Please contact support.");
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
			"dungeon.v2.rewards.processBattleOutcome: processing dg outcome for user: " +
        JSON.stringify({
        	author,
        	userRank,
        	opponentId,
        	isOpponentBot: result.isBot,
        	isVictory: result.isVictory,
        })
		);
		if (result.isVictory) {
			outcomeDesc = `Congratulations summoner **${author.username}**, You ` +
            `have defeated **${opponentUsername}** in Dungeon Ranked Battle! ${emoji.celebration}`;
			promises.push(
				processDGWin(userRank, author.id).then((_dgWin) => {
					resultDesc = _dgWin.desc;
					computedUserRank = _dgWin.userRank;
				})
			);
			if (!result.isBot && opponentUserRank) {
				const userWonPoints = userRank.division * 4;
				const opponentLosePoints = opponentUserRank.division * 2;
				promises.push(
					processDGLose(opponentUserRank, opponentId),
					fetchAndUpdateDgLog(
						author.id,
						{
							attacked: {
								user_tag: opponentId,
								username: opponentUsername,
								outcome: "win",
								rank: opponentUserRank.rank,
								points: userWonPoints
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
								points: opponentLosePoints
							},
						},
						channel,
						false
					)
				);
			}
		} else {
			outcomeDesc = `Summoner **${author.username}**, You were defeated by ` +
            `**${opponentUsername}** in Dungeon Ranked Battle! ${emoji.cry}`;
			promises.push(
				processDGLose(userRank, author.id).then((_dgLose) => {
					resultDesc = _dgLose.desc;
					computedUserRank = _dgLose.userRank;
				})
			);
			if (!result.isBot && opponentUserRank) {
				const userLosePoints = userRank.division * 2;
				const opponentWonPoints = opponentUserRank.division * 4;
				promises.push(
					processDGWin(opponentUserRank, opponentId),
					fetchAndUpdateDgLog(
						author.id,
						{
							attacked: {
								user_tag: opponentId,
								username: opponentUsername,
								outcome: "lose",
								rank: opponentUserRank.rank,
								points: userLosePoints
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
								points: opponentWonPoints
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
