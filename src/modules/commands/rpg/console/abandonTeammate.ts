import { ConfirmationInteractionOptions, ConfirmationInteractionParams } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { delTagTeam, GetTagTeamPlayer } from "api/controllers/TagTeamsController";
import { createEmbed } from "commons/embeds";
import { Message, User } from "discord.js";
import emoji from "emojis/emoji";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import { DEFAULT_ERROR_TITLE } from "helpers/constants/constants";
import loggers from "loggers";
import { confirmationInteraction } from "utility/ButtonInteractions";

const confirmAndAbandonTeammate = async (
	params: ConfirmationInteractionParams<{ id: number; teammate: User; }>,
	options?: ConfirmationInteractionOptions
) => {
	const id = params.extras?.id;
	const teammate = params.extras?.teammate;
	if (!id || !teammate) return;
	if (options?.isConfirm) {
		const [ dmChannel ] = await Promise.all([
			teammate.createDM(),
			delTagTeam({ id })
		]);
		const embed = createEmbed(params.author, params.client)
			.setTitle(`Teammate Abandoned ${emoji.cry}`)
			.setDescription(`Summoner **${params.author.username}** has abandoned **${teammate.username}** ` +
            `${emoji.cry} losing all **points**.\nTeam up with another player using \`\`iz cons tag <@user>\`\``);
		dmChannel.sendMessage(embed);
		params.channel?.sendMessage(embed);
		return;
	}
	return true;
};

export const abandonTeammate = async ({ context, client, options }: BaseProps) => {
	try {
		const { author } = options;
		let embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		const tagTeam = await GetTagTeamPlayer({ user_tag: author.id });
		if (!tagTeam) {
			embed.setDescription(`Summoner **${author.username}**, you are currently not in a team.\n` +
            "Team up with another player using ``iz cons tag <@user>``");
			context.channel?.sendMessage(embed);
			return;
		}
		const teammate = await client.users.fetch(tagTeam.players[author.id].teammate);

		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			{
				channel: context.channel,
				client,
				author,
				extras: {
					id: tagTeam.id,
					teammate
				}
			},
			confirmAndAbandonTeammate,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client)
						.setDescription(`Summoner **${author.username}**, Are you sure you want to abandon ` +
                        `${teammate.username}? You will lose all points accumulated by your team.`)
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
		loggers.error("abandonTeammate: ERROR", err);
		return;
	}
};