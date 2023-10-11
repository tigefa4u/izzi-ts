import { AuthorProps, ChannelProp } from "@customTypes";
import { BattleStats } from "@customTypes/adventure";
import { UserRankProps } from "@customTypes/userRanks";
import { decreaseGuildMMR, increaseGuildMMR } from "api/controllers/GuildsController";
import { updateUserRank } from "api/controllers/UserRanksController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { randomNumber } from "helpers";
import { CONSOLE_BUTTONS, DUNGEON_DEFAULTS, PVP_XP } from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { viewBattleLogs } from "../adventure/battle/viewBattleLogs";
import { reducedComputedLevels } from "./computeLevel";

type P = {
  author: AuthorProps;
  client: Client;
  channel: ChannelProp;
  userRank?: UserRankProps;
  result?: BattleStats;
};
export const handleDungeonBattleOutcome = async ({
	author,
	client,
	channel,
	userRank,
	result,
}: P) => {
	try {
		if (!userRank) {
			channel?.sendMessage("Unable to process DG");
			return;
		}
		const embed = createEmbed(author, client);
		let resultDesc = "";
		let computeduserRank = {} as UserRankProps;
		if (result?.isVictory) {
			const { userRank: computedRank, desc } = await processDGWin(
				userRank,
				author.id
			);
			resultDesc = desc;
			computeduserRank = computedRank;
		} else {
			const { userRank: computedRank, desc } = await processDGLose(
				userRank,
				author.id
			);

			resultDesc = desc;
			computeduserRank = computedRank;
		}
		embed
			.setTitle(
				result?.isVictory
					? `Victory ${emoji.celebration}!`
					: `Defeated ${emoji.cry}`
			)
			.setDescription(
				resultDesc +
          `\n${emojiMap(computeduserRank.rank)} ${emojiMap(
          	`${
          		computeduserRank.rank === "grand master"
          			? computeduserRank.rank
          			: "division"
          	}${computeduserRank.division}`
          )}` +
          `\n\nYou currently have __[${computeduserRank.exp} / ${
          	computeduserRank.r_exp
          }]__${result?.soulGainText ? `\n${result.soulGainText}` : ""}`
			);

		const buttons = customButtonInteraction(
			channel,
			[
				{
					label: CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.label,
					params: { id: CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.id }
				}
			],
			author.id,
			({ id }) => {
				if (id === CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.id && result?.attachments && result?.simulation) {
					viewBattleLogs({
						simulation: result.simulation,
						authorId: author.id,
						attachments: result.attachments,
						channel
					});
				}
				return;
			},
			() => {
				return;
			},
			false,
			5
		);

		if (buttons) {
			embed.setButtons(buttons);
		}

		channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.dungeon.rewards.handleDungeonBattleOutcome: ERROR",
			err
		);
		return;
	}
};

export async function processDGWin(userRank: UserRankProps, id: string) {
	const goldReward = userRank.rank_id * randomNumber(300, 500);
	let desc = `• You have received __${goldReward}__ gold ${emoji.gold}`;
	const xpGain = PVP_XP.WIN;
	userRank.exp = userRank.exp + xpGain;
	desc = desc + `\n• You have gained __${xpGain}__ xp`;
	const user = await getRPGUser({ user_tag: id });
	if (!user) {
		throw new Error("Unable to process user: User not found, processDGWin()");
	}
	userRank.wins = userRank.wins + 1;
	userRank.match_making_rate = userRank.match_making_rate + PVP_XP.MMR_GAIN;
	const bodyParams = {
		wins: userRank.wins,
		exp: userRank.exp,
		match_making_rate: userRank.match_making_rate
	};
	const baseCondition =
    userRank.exp >= userRank.r_exp &&
    userRank.rank_id <= DUNGEON_DEFAULTS.numberOfRanks &&
    userRank.division <= DUNGEON_DEFAULTS.numberOfDivisions;

	if (
		baseCondition &&
    !(
    	userRank.rank_id === DUNGEON_DEFAULTS.numberOfRanks &&
      userRank.division === DUNGEON_DEFAULTS.numberOfDivisions
    )
	) {
		userRank.r_exp = userRank.r_exp + DUNGEON_DEFAULTS.r_exp;
		if (userRank.division < DUNGEON_DEFAULTS.numberOfDivisions) {
			userRank.division = userRank.division + 1;
		} else if (
			userRank.division >= DUNGEON_DEFAULTS.numberOfDivisions &&
      userRank.rank_id < DUNGEON_DEFAULTS.numberOfRanks
		) {
			userRank.division = DUNGEON_DEFAULTS.division;
			userRank.rank_id = userRank.rank_id + 1;
			const computedLevels = reducedComputedLevels();
			userRank.rank = computedLevels[userRank.rank_id].name;
			Object.assign(bodyParams, {
				rank: userRank.rank,
				rank_id: userRank.rank_id,
			});
		}
		loggers.info(
			`Promoting user to: rank ${userRank.rank} id: ${userRank.rank_id} division: ${userRank.division}`
		);
		Object.assign(bodyParams, {
			division: userRank.division,
			r_exp: userRank.r_exp,
		});
		desc =
      desc +
      `\n\n**Promotion**\n• You have been promoted to **${titleCase(
      	userRank.rank
      )}** __division ${userRank.division}__`;
	}
	user.gold = user.gold + goldReward;
	const _promises = [
		updateRPGUser({ user_tag: id }, { gold: user.gold }),
		updateUserRank({ user_tag: id }, bodyParams),
	];
	await Promise.all(_promises);

	return {
		userRank,
		desc,
	};
}

export async function processDGLose(userRank: UserRankProps, id: string) {
	userRank.loss = userRank.loss + 1;
	userRank.exp = userRank.exp - PVP_XP.LOSS;
	if (userRank.exp <= 0) userRank.exp = 0;

	userRank.match_making_rate = userRank.match_making_rate - PVP_XP.MMR_LOSS;
	if (userRank.match_making_rate < 0) userRank.match_making_rate = 0;
	const bodyParams = {
		loss: userRank.loss,
		exp: userRank.exp,
		match_making_rate: userRank.match_making_rate
	};
	let desc = `• You have lost __${PVP_XP.LOSS}__ xp`;
	if (
		userRank.rank_id === DUNGEON_DEFAULTS.rank_id &&
    userRank.division == DUNGEON_DEFAULTS.division
	) {
		loggers.info(
			"Updating on default user rank and division, :: rank_id: 1, division: 1"
		);
		await updateUserRank({ user_tag: id }, bodyParams);
		return {
			desc,
			userRank,
		};
	}

	const prevExp =
    (userRank.division - 1) * DUNGEON_DEFAULTS.r_exp +
    (userRank.rank_id - 1) *
      (DUNGEON_DEFAULTS.numberOfDivisions * DUNGEON_DEFAULTS.r_exp);
	if (userRank.exp < prevExp) {
		userRank.division = userRank.division - 1;
		userRank.r_exp = prevExp;
		if (userRank.division <= 0) {
			userRank.division = DUNGEON_DEFAULTS.numberOfDivisions;
			userRank.rank_id = userRank.rank_id - 1;
			const computedLevels = reducedComputedLevels();
			userRank.rank = computedLevels[userRank.rank_id].name;
			Object.assign(bodyParams, {
				rank: userRank.rank,
				rank_id: userRank.rank_id,
			});
		}
		loggers.info(
			`Demoting user to: rank ${userRank.rank} id: ${userRank.rank_id} division: ${userRank.division}`
		);
		Object.assign(bodyParams, {
			division: userRank.division,
			r_exp: userRank.r_exp,
		});

		desc =
      desc +
      `\n\n**Demotion**\n• You have been demoted to **${titleCase(
      	userRank.rank
      )}** __division ${userRank.division}__`;
	}

	await updateUserRank({ user_tag: id }, bodyParams);

	return {
		userRank,
		desc,
	};
}
