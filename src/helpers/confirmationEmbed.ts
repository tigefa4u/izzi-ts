import { AuthorProps } from "@customTypes";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";

export const createConfirmationEmbed = (author: AuthorProps, client: Client) => {
	const embed = createEmbed(author, client)
		.setTitle("Confirmation :exclamation:");

	return embed;
};