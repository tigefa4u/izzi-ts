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
  userRank?: UserRankProps;
  channel: ChannelProp;
  opponentId: string;
  opponentUsername: string;
};
export const processBattleOutcome = async ({
	result,
	opponentId,
	client,
	author,
	userRank,
	channel,
	opponentUsername,
}: O) => {
	try {
		if (!userRank) {
			channel?.sendMessage("Unable to process DG, please try again later");
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
