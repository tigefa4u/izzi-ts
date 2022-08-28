import { ConfirmationInteractionOptions, ConfirmationInteractionParams } from "@customTypes";
import { RaidActionProps } from "@customTypes/raids";
import { updateRaid } from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { validateCurrentRaid } from "./validateRaid";

async function confirmMakeLeader(
	params: ConfirmationInteractionParams<{ userId: number; isEvent?: boolean; memberId: number; }>,
	options?: ConfirmationInteractionOptions
) {
	const userId = params.extras?.userId;
	const memberId = params.extras?.memberId;
	if (!userId || !memberId) return;
	const currentRaid = await validateCurrentRaid(userId, params.author, params.client, params.channel);
	if (!currentRaid) return;
	const embed = createEmbed(params.author, params.client)
		.setTitle(DEFAULT_ERROR_TITLE);
	const leader = currentRaid.lobby[userId];
	if (!leader.is_leader) {
		embed.setDescription(`Summoner **${params.author.username}**, only the ` +
        "current Lobby Leader can use this command");
		params.channel?.sendMessage(embed);
		return;
	}
	const member = currentRaid.lobby[memberId];
	if (!member) return;
	if (member.is_leader) {
		embed.setDescription(`**Summoner ${member.username}** is already the leader ` +
        `of this ${params.extras?.isEvent ? "Event" : "Raid"} Lobby`);
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		currentRaid.lobby[userId].is_leader = false;
		currentRaid.lobby[memberId].is_leader = true;
		await updateRaid({ id: currentRaid.id }, { lobby: currentRaid.lobby });

		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Summoner **${member.username}** is now the Lobby Leader`);
		params.channel?.sendMessage(embed);
		return;
	}
	return member;
}

export const makeLeader = async ({
	context,
	client,
	args,
	options,
	isEvent
}: RaidActionProps) => {
	try {
		const author = options.author;
		const memberId = Number(args.shift());
		if (!memberId || isNaN(memberId)) return;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		let embed = createEmbed(author, client);
		let sentMessage: Message;

		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			{
				channel: context.channel,
				author,
				client,
				extras: {
					userId: user.id,
					isEvent,
					memberId: memberId
				}
			},
			confirmMakeLeader,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client)
						.setDescription(`Are you sure you want to transfer Lobby Leadership to **${data?.username}**`);
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
		loggers.error("modules.commands.rpg.raids.actions.makeLeader() something went wrong", err);
		return;
	}
};