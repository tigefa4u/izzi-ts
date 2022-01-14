// import { MessageAttachment, MessageButton, MessageEmbed } from "discord.js";
// import { CustomEmbedProps } from "@customTypes/embed";

import { Client, MessageEmbed } from "discord.js";
import { EmbedProps } from "@customTypes/embed";
import { AuthorProps } from "@customTypes";

export const createEmbed: EmbedProps = (author?: AuthorProps, client?: Client) => {
	const embed = new MessageEmbed();
	embed.setColor(13148872);
	if (author) {
		embed.setAuthor({
			name: author.username,
			iconURL: author.displayAvatarURL()
		});
	}
	if (client) {
		embed
			.setThumbnail(client.user?.displayAvatarURL() || "");
	}
	return embed;
};