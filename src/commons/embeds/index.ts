// import { MessageAttachment, MessageButton, MessageEmbed } from "discord.js";
// import { CustomEmbedProps } from "@customTypes/embed";

import { Client, EmbedAuthorData, MessageEmbed } from "discord.js";
import { EmbedProps } from "@customTypes/embed";
import { AuthorProps } from "@customTypes";
import { EMBED_DEFAULT_COLOR } from "helpers/constants/constants";
import { parsePremiumUsername } from "helpers";

export const createEmbed: EmbedProps = (author?: AuthorProps, client?: Client) => {
	const embed = new MessageEmbed();
	embed.setColor(EMBED_DEFAULT_COLOR)
		.setTimestamp();
	if (author) {
		const params = { name: parsePremiumUsername(author.username), } as EmbedAuthorData;
		if (author.displayAvatarURL) {
			params.iconURL = author.displayAvatarURL();
		}
		if (author.accentColor) {
			embed.setColor(author.accentColor);
		}
		embed.setAuthor(params);
	}
	if (client) {
		embed
			.setThumbnail(client.user?.displayAvatarURL() || "");
	}
	return embed;
};