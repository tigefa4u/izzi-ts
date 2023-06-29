import { ConfirmationInteractionOptions, ConfirmationInteractionParams } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { createTagTeams, GetTagTeamPlayer } from "api/controllers/TagTeamsController";
import { createEmbed } from "commons/embeds";
import { Message, User } from "discord.js";
import { getIdFromMentionedString } from "helpers";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";
import { confirmationInteraction } from "utility/ButtonInteractions";

const validateAndConfirmTeamup = async (
	params: ConfirmationInteractionParams<{ mentionedUser: User; }>,
	options?: ConfirmationInteractionOptions
) => {
	const mentionedUser = params.extras?.mentionedUser;
	if (!mentionedUser) return;
	const [ tagTeam, mentionedTagTeam ] = await Promise.all([
		GetTagTeamPlayer({ user_tag: params.author.id }),
		GetTagTeamPlayer({ user_tag: mentionedUser.id })
	]);

	const embed = createEmbed(params.author, params.client).setTitle(DEFAULT_ERROR_TITLE);
	if (tagTeam || mentionedTagTeam) {
		const message = tagTeam ? "You have already Teamed up with another player. " +
        "Use ``iz cons abandon`` to abandon your current teammate." : 
			`${mentionedUser.username} has already Teamed up with another player.`;
		embed.setDescription(
			`Summoner **${params.author.username}**, ${message}`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		await createTagTeams({
			name: `${params.author.id}-${mentionedUser.id}`,
			players: {
				[params.author.id]: {
					user_tag: params.author.id,
					username: params.author.username,
					teammate: mentionedUser.id
				},
				[mentionedUser.id]: {
					user_tag: mentionedUser.id,
					username: mentionedUser.username,
					teammate: params.author.id
				}
			},
		});
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Summoner **${params.author.username}** and **${mentionedUser.username}** ` +
            "have formed a tag team. Good luck with your ventures!\n" +
            "Use ``iz cons abandon`` to abandon your teammate.");
		params.channel?.sendMessage(embed);
		return;
	}
	return true;
};

export const teamUp = async ({ context, options, client, args }: BaseProps) => {
	try {
		const { author } = options;
		let embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		const mentionedUserId = getIdFromMentionedString(args.shift());
		if (!mentionedUserId) {
			embed.setDescription(`Summoner **${author.username}**, the player ` +
            "you want to team up with does not exist.");
			context.channel?.sendMessage(embed);
			return;
		}
		if (mentionedUserId === author.id) {
			embed.setDescription("You cannot team up with yourself.");
			context.channel?.sendMessage(embed);
			return;
		}
		const mentionedUser = await client.users.fetch(mentionedUserId);
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			mentionedUser.id,
			{
				channel: context.channel,
				client,
				author,
				extras: { mentionedUser }
			},
			validateAndConfirmTeamup,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client)
						.setDescription(`Hey **${mentionedUser.username}**, Summoner **${author.username}** ` + 
                        "wants to Team up with you!")
						.setHideConsoleButtons(true);
				}
				if (opts?.isDelete) {
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;
		embed.setButtons(buttons);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("tagTeam.teamUp: ERROR", err);
		return;
	}
};