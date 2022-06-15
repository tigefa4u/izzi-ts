// import { MessageAttachment, MessageButton, MessageEmbed } from "discord.js";
// import { CustomEmbedProps } from "@customTypes/embed";

import { Client, MessageEmbed } from "discord.js";
import { EmbedProps } from "@customTypes/embed";
import { AuthorProps } from "@customTypes";
import { EMBED_DEFAULT_COLOR } from "helpers/constants";
import emoji from "emojis/emoji";

export const createEmbed: EmbedProps = (author?: AuthorProps, client?: Client) => {
	const embed = new MessageEmbed();
	embed.setColor(EMBED_DEFAULT_COLOR);
	if (author) {
		let username = author.username;
		try {
			const splitUser = author.username.split(emoji.premium)[1];
			if (splitUser) {
				username = splitUser;
			}
		} catch (err) {
			username = author.username;
			// pass
		}
		embed.setAuthor({
			name: username,
			iconURL: author.displayAvatarURL()
		});
	}
	if (client) {
		embed
			.setThumbnail(client.user?.displayAvatarURL() || "");
	}
	return embed;
};