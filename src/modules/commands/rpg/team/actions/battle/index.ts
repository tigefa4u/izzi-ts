import {
	AuthorProps,
	ChannelProp,
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getTeamById } from "api/controllers/TeamsController";
import { getRPGUser, getUser } from "api/controllers/UsersController";
import emoji from "emojis/emoji";
import { getIdFromMentionedString } from "helpers";
import {
	prepareTeamForBattle,
	validateAndPrepareTeam,
	validateTeam,
} from "helpers/teams";
import loggers from "loggers";
import { simulateBattle } from "../../../adventure/battle/battle";
import * as battlePerChannel from "../../../adventure/battle/battlesPerChannelState";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { addTeamEffectiveness } from "helpers/adventure";
import { confirmationInteraction, customButtonInteraction } from "utility/ButtonInteractions";
import { UserProps } from "@customTypes/users";
import { Message } from "discord.js";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import Cache from "cache";
import { Simulation } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { CONSOLE_BUTTONS } from "helpers/constants";
import { viewBattleLogs } from "modules/commands/rpg/adventure/battle/viewBattleLogs";

async function confirmAndBattle(
	params: ConfirmationInteractionParams<{
    context: BaseProps["context"];
    user: UserProps;
    mentionedUser: UserProps;
    mentionId: string;
	cb: () => void;
  }>,
	options?: ConfirmationInteractionOptions
) {
	const user = params.extras?.user;
	const mentionedUser = params.extras?.mentionedUser;
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
		const [ playerStats, opponentStats ] = await Promise.all([
			validateAndPrepareTeam(
				user.id,
				user.user_tag,
				user.selected_team_id,
				params.channel,
				canDisableGuildStats ? false : true
			),
			validateAndPrepareTeam(
				mentionedUser.id,
				mentionedUser.user_tag,
				mentionedUser.selected_team_id,
				params.channel,
				canDisableGuildStats ? false : true
			),
		]);
		if (!playerStats) {
			params.channel?.sendMessage(
				`Summoner **${params.author.username}** is unable to prepare for battle. Please reset your team`
			);
			return;
		}
		if (!opponentStats) {
			params.channel?.sendMessage(
				`Summoner **${mentionedUser.username}** is unable to prepare for battle. Please reset your team`
			);
			return;
		}
		const {
			playerStats: effectiveStats,
			opponentStats: opponentEffectiveStats,
		} = addTeamEffectiveness({
			cards: playerStats.stats.cards,
			enemyCards: opponentStats.stats.cards,
			playerStats: playerStats.stats.totalStats,
			opponentStats: opponentStats.stats.totalStats,
		});
		playerStats.stats.totalStats = effectiveStats;
		opponentStats.stats.totalStats = opponentEffectiveStats;
		Promise.all([
			setCooldown(params.author.id, "in-battle", 60 * 5),
			setCooldown(mentionId, "in-battle", 60 * 5),
		]);
		const battleStatus = await simulateBattle({
			context,
			playerStats: playerStats.stats,
			enemyStats: opponentStats.stats,
			title: `__Team Battle Challenge ${params.author.username} vs ${mentionedUser.username}__`,
			isRaid: false
		});
		Promise.all([
			clearCooldown(params.author.id, "in-battle"),
			clearCooldown(mentionId, "in-battle"),
		]);
		if (battleStatus?.isForfeit) return;
		sendResultMessage({
			channel: params.channel,
			username: params.author.username,
			mentionUsername: mentionedUser.username,
			isVictory: battleStatus?.isVictory || false,
			opponentTeamName: opponentStats.name,
			playerTeamName: playerStats.name,
			authorId: params.author.id
		});
		return;
	}
	return true;
}

export const teamBattle = async ({
	client,
	context,
	args,
	author,
}: Omit<BaseProps, "options"> & { author: AuthorProps; user_id: number }) => {
	try {
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
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const mentionedUser = await getUser({
			user_tag: mentionId,
			is_banned: false,
		});
		if (!mentionedUser) return;
		if (!user.selected_team_id || !mentionedUser.selected_team_id) {
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
				user,
				mentionedUser,
				context,
				mentionId,
				cb: () => {
					sentMessage.deletable && sentMessage.deleteMessage();
				}
			},
		};

		const embed = createConfirmationEmbed(author, client).setDescription(
			`**Hey ${mentionedUser.username} ${emoji.calm}!**` +
			`\nSummoner **${author.username}** has requested for a team fight.\nReact with to accept.`
		);
		const buttons = await confirmationInteraction(
			context.channel,
			mentionedUser.user_tag,
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
		loggers.error(
			"modules.commands.rpg.team.teamBattle: ERROR",
			err
		);
		return;
	}
};

function sendResultMessage({
	channel,
	username,
	mentionUsername,
	isVictory,
	playerTeamName,
	opponentTeamName,
	simulation,
	attachments,
	authorId
}: {
  channel: ChannelProp;
  username: string;
  mentionUsername: string;
  isVictory: boolean;
  playerTeamName: string;
  opponentTeamName: string;
  simulation?: Simulation;
  attachments?: (CollectionCardInfoProps | undefined)[];
  authorId: string;
}) {
	let button;
	if (simulation && attachments) {
		button = customButtonInteraction(
			channel,
			[
				{
					label: CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.label,
					params: { id: CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.id, }
				}
			],
			authorId,
			() => {
				viewBattleLogs({
					simulation,
					attachments,
					authorId,
					channel
				});
				return;
			},
			() => {
				return;
			},
			false,
			5
		);
	}
	channel?.send(
		{
			content: `Congratulations ${emoji.welldone} **${
				isVictory ? username : mentionUsername
			}!** You have defeated ${isVictory ? mentionUsername : username}'s __Team ${
				isVictory ? opponentTeamName : playerTeamName
			}__ in battle!`,
			components: button ? [ button ] : []
		}
	);

	return;
}
