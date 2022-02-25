import { RaidActionProps } from "@customTypes/raids";
import { updateRaid } from "api/controllers/RaidsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import loggers from "loggers";
import { validateCurrentRaid } from "./validateRaid";

export const toggleLobbyType = async ({
	context,
	client,
	options,
	isEvent,
	isPrivate = false,
}: RaidActionProps & { isPrivate?: boolean }) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const currentRaid = await validateCurrentRaid(
			user.id,
			author,
			client,
			context.channel
		);
		if (!currentRaid) return;
		const raidMember = currentRaid.json_array_elements;
		if (!raidMember?.is_leader) {
			context.channel?.sendMessage(
				"You are not allowed to perform this action"
			);
			return;
		}
		if (currentRaid.is_start) {
			context.channel?.sendMessage(
				`The ${isEvent ? "Event" : "Raid"} Challenge has already started!`
			);
			return;
		}
		if (currentRaid.is_private === isPrivate) {
			context.channel?.sendMessage(
				`Summoner ${author.username}, this lobby already ${
					isPrivate ? "private" : "public"
				}`
			);
			return;
		}
		currentRaid.is_private = isPrivate;
		await updateRaid(
			{ id: currentRaid.id },
			{ is_private: currentRaid.is_private }
		);
		const embed = createEmbed(author, client)
			.setTitle(
				`${isPrivate ? "Private" : "Public"} ${
					isEvent ? "Event" : "Raid"
				} Challenge`
			)
			.setDescription(
				`Successfully set ${isEvent ? "Event" : "Raid"} Challenge to ${
					isPrivate ? "private" : "public"
				} ${emoji.celebration}!\nInvite others to join you on your conquest using \`\`iz ${
					isEvent ? "ev" : "rd"
				} ${isPrivate ? "invite <@user>" : `join ${currentRaid.id}`}\`\``
			);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.raids.actions.toggleLobbyType(): something went wrong",
			err
		);
		return;
	}
};
