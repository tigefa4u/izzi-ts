import { AuthorProps } from "@customTypes";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";

export const createConfirmationEmbed = (author: AuthorProps, client: Client) => {
	const embed = createEmbed()
		.setTitle("CONFIRMATION")
		.setAuthor({
			name: author.username,
			iconURL: author.displayAvatarURL()
		})
		.setThumbnail(client.user?.displayAvatarURL() || "");

	return embed;
};