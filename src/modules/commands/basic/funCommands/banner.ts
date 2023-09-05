import { BaseProps } from "@customTypes/command";
import { EmojiProps } from "@customTypes/emojis";
import emoji from "emojis/emoji";
import { IZZI_SAY_BANNER_TEXT_LIMIT } from "helpers/funCommandConstants";
import loggers from "loggers";

export const izziBanner = async ({ context, options, args }: BaseProps) => {
	try {
		const { author } = options;
		const text = (args.join(" ") || "").trim().replace(/[^A-Z0-9]+/ig, "");
		if (!text || text.length > IZZI_SAY_BANNER_TEXT_LIMIT) {
			context.channel?.sendMessage(`Summoner **${author.username}**, ` +
			`Please enter a valid message between 1 and ${IZZI_SAY_BANNER_TEXT_LIMIT} characters.`);
			return;
		}
		let regionalText = "";
		for (let i = 0; i < text.length; i++) {
			const ch = text.charAt(i);
			const isNumber = !isNaN(Number(ch));
			if (isNumber) {
				regionalText += emoji[ch as keyof EmojiProps];
			} else {
				regionalText += `:regional_indicator_${ch}:`;
			}
		}

		const msg = await context.channel?.messages.fetch(context.id);
		if (!msg?.deletable) {
			regionalText += " (To hide your original message, Izzi requires the `MANAGE_MESSAGES` permissions).";
		}
		context.channel?.sendMessage(regionalText);
		if (msg && msg.deletable) {
			msg.deleteMessage();
		}
		return;
	} catch (err) {
		loggers.error("commands.basics.funCommands.izziBanner: ERROR", err);
		return;
	}
};