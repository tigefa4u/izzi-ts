import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { RaidActionProps } from "@customTypes/raids";
import { UserProps } from "@customTypes/users";
import { getUserRaidLobby, updateRaid } from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { getIdFromMentionedString } from "helpers";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	HIGH_LEVEL_RAIDS,
	MAX_RAID_LOBBY_MEMBERS,
	MIN_RAID_USER_LEVEL,
	PERMIT_PER_RAID,
	REACTIONS,
} from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { prepareInitialLobbyMember } from "..";
import { validateCurrentRaid } from "./validateRaid";

async function validateAndAcceptRaid(
	params: ConfirmationInteractionParams<{
    user_id: number;
    mentionedUser: UserProps;
    isEvent: boolean;
  }>,
	options?: ConfirmationInteractionOptions
) {
	const userId = params.extras?.user_id;
	const mentionedUser = params.extras?.mentionedUser;
	const isEvent = params.extras?.isEvent;
	if (!userId || !mentionedUser) return;

	const currentRaid = await validateCurrentRaid(
		userId,
		params.author,
		params.client,
		params.channel
	);
	if (!currentRaid) return;
	else if (!currentRaid.is_private) {
		return;
	} else if (Object.keys(currentRaid.lobby).length >= MAX_RAID_LOBBY_MEMBERS) {
		params.channel?.sendMessage("The Challenger Lobby is already full.");
		return;
	} else if (!currentRaid.lobby[userId].is_leader) {
		params.channel?.sendMessage(`Summoner ${params.author.username}, You cannot invite others to the ${
			isEvent ? "Event" : "Raid"
		} Challenge!\nPlease ask the Lobby Leader to do so.`);
		return;
	}

	const embed = createEmbed(params.author, params.client).setTitle(
		DEFAULT_ERROR_TITLE
	);
	if (currentRaid.is_start) {
		embed.setDescription(
			`The ${isEvent ? "Event" : "Raid"} Challenge has already start! Use \`\`${
				isEvent ? "ev" : "rd"
			} battle\`\` to battle the ${isEvent ? "Event" : "Raid"} Boss!`
		);
		params.channel?.sendMessage(embed);
		return;
	}

	const _isInRaid = await getUserRaidLobby({ user_id: mentionedUser.id });
	if (_isInRaid) {
		params.channel?.sendMessage(
			`Summoner **${mentionedUser.username}** is already in a ${
				isEvent ? "Event" : "Raid"
			} Challenge!`
		);
		return;
	}
	if (mentionedUser.level < MIN_RAID_USER_LEVEL && HIGH_LEVEL_RAIDS.includes(currentRaid.stats.difficulty)) {
		params.channel?.sendMessage(`Summoner **${mentionedUser.username}** must be atleast level ` +
		`__${MIN_RAID_USER_LEVEL}__ ` +
		"to be able to spawn or join __high level(Hard / Immortal)__ Raids.");
		return;
	}
	if (options?.isConfirm) {
		const lobby = currentRaid.lobby;
		Object.assign(lobby, {
			...prepareInitialLobbyMember(
				mentionedUser.id,
				mentionedUser.user_tag,
				mentionedUser.username,
				mentionedUser.level,
				false
			),
		});
		await updateRaid({ id: currentRaid.id }, { lobby });

		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Summoner **${mentionedUser.username}** has accepted to join you on your conquest!`);

		params.channel?.sendMessage(embed);
		return;
	}
	return { accept: true };
}

export const inviteToRaid = async ({
	context,
	options,
	client,
	isEvent,
	args,
}: RaidActionProps) => {
	try {
		const author = options.author;
		const cooldownCommand = "invite-to-raid";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage("You can use this command again after a minute.");
			return;
		}
		const mentionId = getIdFromMentionedString(args.shift() || "");
		if (mentionId === author.id) return;
		const [ user, mentionedUser ] = await Promise.all([
			getRPGUser({ user_tag: author.id }, { cached: true }),
			getRPGUser({ user_tag: mentionId }),
		]);
		if (!user || !mentionedUser) return;
		if (mentionedUser.raid_pass < PERMIT_PER_RAID) {
			context.channel?.sendMessage(
				`Summoner **${
					mentionedUser.username
				}** does not have enough Permit(s) to join a ${
					isEvent ? "Event" : "Raid"
				} Challenge`
			);
			return;
		}
		const params = {
			client,
			channel: context.channel,
			author,
			extras: {
				user_id: user.id,
				mentionedUser,
				isEvent,
			},
		};
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			mentionId,
			params,
			validateAndAcceptRaid,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client)
						.setTitle(`${isEvent ? "Event" : "Raid"} Challenge Invitation`)
						.setDescription(
							`Hey **${mentionedUser.username}** ${emoji.calm},\n**${
								author.username
							}** has invited you to join their ${
								isEvent ? "event" : "raid"
							} challenge conquest!\nReact with ${
								REACTIONS.confirm.emoji
							} to accept`
						);
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;

		embed.setButtons(buttons);
		setCooldown(author.id, cooldownCommand);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.raids.actions.inviteToRaid(): something went wrong",
			err
		);
		return;
	}
};
