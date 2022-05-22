import { ConfirmationInteractionOptions, ConfirmationInteractionParams } from "@customTypes";
import { RaidActionProps, RaidLobbyProps, RaidProps } from "@customTypes/raids";
import { updateRaid } from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import loggers from "loggers";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { validateCurrentRaid } from "./validateRaid";

async function confirmRaidLeave(
	params: ConfirmationInteractionParams<{ user_id: number; currentRaid: RaidProps; isEvent: boolean; }>,
	options?: ConfirmationInteractionOptions
) {
	if (!params.extras?.user_id || !params.extras.currentRaid) return;
	if (options?.isConfirm) {
		processRaidLeave(params.extras.currentRaid, params.extras.user_id);
		params.channel?.sendMessage(`You have left the ${params.extras.isEvent ? "Event" : "Raid"} Challenge`);
		return;
	}
	return true;
}

const processRaidLeave = async (currentRaid: RaidProps, user_id: number) => {
	const lobby = currentRaid.lobby;
	const member = lobby[user_id];
	delete lobby[user_id];
	if (member.is_leader) {
		const lobbyMembers: (keyof RaidLobbyProps)[] = Object.keys(lobby).map((k) => Number(k));
		if (lobbyMembers.length > 0) {
			lobby[lobbyMembers[0]].is_leader = true;
		}
	}
	const body = { lobby };
	if (Object.keys(lobby).length <= 0 && currentRaid.is_start === false) {
		currentRaid.is_private = false;
		Object.assign(body, { is_private: currentRaid.is_private });
	}
	await updateRaid({ id: currentRaid.id }, body);
};

export const leaveLobby = async ({ context, options, client, isEvent }: RaidActionProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const currentRaid = await validateCurrentRaid(user.id, author, client, context.channel);
		if (!currentRaid) return;
		if (currentRaid.is_start === true) {
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
						user_id: user.id,
						currentRaid,
						isEvent
					}
				},
				confirmRaidLeave,
				(_, opts) => {
					embed = createConfirmationEmbed(author, client)
						.setDescription("Are you sure you want to leave this Raid? " +
						"This raid has already started and you will lose __2__ **Permits**");

					if (opts?.isDelete) {
						sentMessage.deleteMessage();
					}
					return;
				}
			);
			if (buttons) {
				embed.setButtons(buttons);
			}
			const msg = await context.channel?.sendMessage(embed);
			if (msg) {
				sentMessage = msg;
			}
			return;
		}
		processRaidLeave(currentRaid, user.id);
		context.channel?.sendMessage(`You have left the ${isEvent ? "Event" : "Raid"} Challenge`);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.actions.leaveLobby(): something went wrong", err);
		return;
	}
};