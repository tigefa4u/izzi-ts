import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { DzFuncProps } from "@customTypes/darkZone";
import { DarkZoneProfileProps } from "@customTypes/darkZone/profile";
import { getDarkZoneProfile } from "api/controllers/DarkZoneController";
import { getDzTeam } from "api/controllers/DarkZoneTeamsController";
import Cache from "cache";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { getIdFromMentionedString } from "helpers";
import { addTeamEffectiveness } from "helpers/adventure";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import { prepareTeamForBattle } from "helpers/teams";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { simulateBattle } from "../../adventure/battle/battle";
import * as battlePerChannel from "../../adventure/battle/battlesPerChannelState";
import { sendResultMessage } from "../../team/actions/battle";

const validateAndFetchDzTeam = async (user_tag: string) => {
	try {
		const dzTeam = await getDzTeam(user_tag);
		if (!dzTeam) {
			return;
		}
		const teamCards = dzTeam.team.filter((t) => t.collection_id !== null);
		if (teamCards.length <= 0) return;
		return dzTeam;
	} catch (err) {
		return;
	}
};

async function confirmAndBattle(
	params: ConfirmationInteractionParams<{
    context: BaseProps["context"];
    dzUser: DarkZoneProfileProps;
    mentionedDzUser: DarkZoneProfileProps;
    mentionId: string;
    cb: () => void;
  }>,
	options?: ConfirmationInteractionOptions
) {
	const user = params.extras?.dzUser;
	const mentionedUser = params.extras?.mentionedDzUser;
	const mentionId = params.extras?.mentionId;
	const context = params.extras?.context;
	if (
		!user ||
    !mentionedUser ||
    !mentionId ||
    !context ||
    !user.selected_team_id ||
    !mentionedUser.selected_team_id
	)
		return;

	if (options?.isConfirm) {
		params.extras?.cb();
		const [ _inBattle, _mentionIdInBattle ] = await Promise.all([
			getCooldown(params.author.id, "in-battle"),
			getCooldown(mentionId, "in-battle"),
		]);
		if (_inBattle || _mentionIdInBattle) {
			params.channel?.sendMessage(
				"One of the summoners' is currently in a team battle"
			);
			return;
		}
		const key = "tourney::" + context.guild?.id;
		const canDisableGuildStats = await Cache.get(key);

		const [ dzTeam, mentionedUserDzTeam ] = await Promise.all([
			validateAndFetchDzTeam(params.author.id),
			validateAndFetchDzTeam(mentionId),
		]);
		if (!dzTeam || !mentionedUserDzTeam) {
			params.channel?.sendMessage(
				"Please make sure both players have selected a valid team. :x:"
			);
			return;
		}
		const [ playerStats, opponentStats ] = await Promise.all([
			prepareTeamForBattle({
				team: {
					user_id: user.id,
					name: params.author.username,
					metadata: dzTeam.team,
					id: dzTeam.id,
				},
				isDarkZone: true,
				user_id: user.id,
				id: params.author.id,
				canAddGuildStats: canDisableGuildStats ? false : true,
				capCharacterMaxLevel: true,
			}),
			prepareTeamForBattle({
				team: {
					user_id: mentionedUser.user_id,
					name: mentionedUser.metadata?.username || "Opponent",
					metadata: mentionedUserDzTeam.team,
					id: mentionedUserDzTeam.id,
				},
				isDarkZone: true,
				user_id: mentionedUser.user_id,
				id: mentionId,
				canAddGuildStats: canDisableGuildStats ? false : true,
				capCharacterMaxLevel: true,
			}),
		]);
		if (!playerStats) {
			context.channel?.sendMessage(
				"You do not have a valid Dark Zone team, Please reset your team " +
          "using `iz dz tm reset`"
			);
			return;
		} else if (!opponentStats) {
			context.channel?.sendMessage(
				`**${mentionedUser.metadata?.username || "Opponent"}** does not have ` +
          "a valid Dark Zone team, Please reset your team " +
          "using `iz dz tm reset`"
			);
			return;
		}
		const _effectiveness = addTeamEffectiveness({
			cards: playerStats.cards,
			enemyCards: opponentStats.cards,
			playerStats: playerStats.totalStats,
			opponentStats: opponentStats.totalStats,
		});
		playerStats.totalStats = _effectiveness.playerStats;
		opponentStats.totalStats = _effectiveness.opponentStats;
		Promise.all([
			setCooldown(params.author.id, "in-battle", 60 * 5),
			setCooldown(mentionId, "in-battle", 60 * 5),
		]);
		const battleStatus = await simulateBattle({
			context,
			playerStats: playerStats,
			enemyStats: opponentStats,
			title: `__Dark Zone PvP Challenge ${params.author.username} vs ${
				mentionedUser.metadata?.username || "Opponent"
			}__`,
			isRaid: false,
		});
		Promise.all([
			clearCooldown(params.author.id, "in-battle"),
			clearCooldown(mentionId, "in-battle"),
		]);
		if (!battleStatus) {
			context.channel?.sendMessage(
				"Unable to process battle, please try again later"
			);
			return;
		}
		if (battleStatus?.isForfeit) {
			params.channel?.sendMessage(`**${params.author.username}**, has Forfeit the battle.`);
			return;
		}
		sendResultMessage({
			channel: params.channel,
			username: params.author.username,
			mentionUsername: mentionedUser.metadata?.username || "Opponent",
			isVictory: battleStatus.isVictory || false,
			playerTeamName: params.author.username,
			opponentTeamName: mentionedUser.metadata?.username || "Opponent",
			simulation: battleStatus.simulation,
			attachments: battleStatus.attachments,
			authorId: params.author.id
		});
	}

	return true;
}
export const dzPvpBattle = async ({
	context,
	client,
	args,
	options,
	dzUser,
}: DzFuncProps) => {
	try {
		const { author } = options;
		if (!context.channel?.id) return;
		const battlesInChannel = battlePerChannel.validateBattlesInChannel(
			context.channel.id
		);
		if (battlesInChannel === undefined) return;
		const mentionId = getIdFromMentionedString(args.shift() || "");
		if (!mentionId) return;
		const [ _inBattle, _mentionIdInBattle ] = await Promise.all([
			getCooldown(author.id, "in-battle"),
			getCooldown(mentionId, "in-battle"),
		]);
		if (_inBattle || _mentionIdInBattle) {
			context.channel.sendMessage(
				"One of the summoners' is currently in a team battle"
			);
			return;
		}
		const mentionedDzUser = await getDarkZoneProfile({ user_tag: mentionId });
		if (!mentionedDzUser) {
			context.channel.sendMessage(
				"The player you are trying to PvP does not have a Dark Zone profile."
			);
			return;
		}
		if (!dzUser.selected_team_id || !mentionedDzUser.selected_team_id) {
			context.channel?.sendMessage(
				"Both players must have valid team selected!"
			);
			return;
		}
		let sentMessage: Message;
		const funcParams = {
			author,
			channel: context.channel,
			client,
			extras: {
				dzUser,
				mentionedDzUser,
				context,
				mentionId,
				cb: () => {
					sentMessage.deletable && sentMessage.deleteMessage();
				},
			},
		};

		const embed = createConfirmationEmbed(author, client).setDescription(
			`**Hey ${mentionedDzUser.metadata?.username} ${emoji.calm}!**` +
        `\nSummoner **${author.username}** has requested for a team fight.\nReact with to accept.`
		);
		const buttons = await confirmationInteraction(
			context.channel,
			mentionedDzUser.user_tag,
			funcParams,
			confirmAndBattle,
			(data, opts) => {
				if (opts?.isDelete) {
					sentMessage?.deleteMessage();
				}
			}
		);
		if (!buttons) return;
		embed.setHideConsoleButtons(true);
		embed.setButtons(buttons);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("dzPvpBattle: ERROR", err);
		return;
	}
};
