import { CreateButtonParams } from "@customTypes/button";
import { MessageButton } from "discord.js";
import { REACTIONS_DEFAULT_STYLE } from "helpers/constants/constants";

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
	if (options?.url) {
		button.setURL(options.url);
		button.setCustomId("");
	}
	if (typeof options?.isConsole === "boolean") {
		button.setIsConsoleButton(options.isConsole);
	}
	return button;
};