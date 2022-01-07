// import { MessageAttachment, MessageButton, MessageEmbed } from "discord.js";
// import { CustomEmbedProps } from "@customTypes/embed";

import { MessageEmbed } from "discord.js";
import { EmbedProps } from "@customTypes/embed";

export const createEmbed: EmbedProps = () => {
	const embed = new MessageEmbed();
	embed.setColor(13148872);
	return embed;
};