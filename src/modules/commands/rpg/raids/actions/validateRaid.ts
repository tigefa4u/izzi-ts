import { AuthorProps, ChannelProp } from "@customTypes";
import { getUserRaidLobby } from "api/controllers/RaidsController";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";

export const validateCurrentRaid = async (
	user_id: number,
	author: AuthorProps,
	client: Client,
	channel: ChannelProp
) => {
	const currentRaid = await getUserRaidLobby({ user_id });
	if (!currentRaid) {
		const embed = createEmbed(author, client)
			.setTitle(DEFAULT_ERROR_TITLE)
			.setDescription(
				`Summoner **${author.username}** you are currently not in a raid. ` +
                "You can join an exiting raid or ask a friend to invite you!"
			);

		channel?.sendMessage(embed);
		return;
	}
	return currentRaid;
};
