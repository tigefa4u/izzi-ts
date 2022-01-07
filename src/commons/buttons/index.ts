import { CreateButtonParams } from "@customTypes/button";
import { MessageButton } from "discord.js";
import { REACTIONS_DEFAULT_STYLE } from "helpers/constants";

export const createButton: CreateButtonParams = (id, options) => {
	const button = new MessageButton()
		.setCustomId(id)
		.setStyle(options?.style || REACTIONS_DEFAULT_STYLE);
	if (options?.label) {
		button.setLabel(options.label);
	}
	if (options?.emoji) {
		button.setEmoji(options.emoji);
	}
	return button;
};