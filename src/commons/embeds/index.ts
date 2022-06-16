// import { MessageAttachment, MessageButton, MessageEmbed } from "discord.js";
// import { CustomEmbedProps } from "@customTypes/embed";

import { Client, MessageEmbed } from "discord.js";
import { EmbedProps } from "@customTypes/embed";
import { AuthorProps } from "@customTypes";
import { EMBED_DEFAULT_COLOR } from "helpers/constants";
import emoji from "emojis/emoji";
import { parsePremiumUsername } from "helpers";

export const createEmbed: EmbedProps = (author?: AuthorProps, client?: Client) => {
	const embed = new MessageEmbed();
	embed.setColor(EMBED_DEFAULT_COLOR);
	if (author) {
		embed.setAuthor({
			name: parsePremiumUsername(author.username),
			iconURL: author.displayAvatarURL()
		});
	}
	if (client) {
		embed
			.setThumbnail(client.user?.displayAvatarURL() || "");
	}
	return embed;
};