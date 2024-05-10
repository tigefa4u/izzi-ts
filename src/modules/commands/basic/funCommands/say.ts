import { BaseProps } from "@customTypes/command";
import { getIdFromMentionedString } from "helpers";
import { IZZI_SAY_BANNER_TEXT_LIMIT } from "helpers/constants/funCommandConstants";
import loggers from "loggers";

export const izziSpeak = async ({ context, options, args }: BaseProps) => {
	try {
		const { author } = options;
		let text = args.join(" ");
		const mentionString = getIdFromMentionedString(text);
		text = mentionString.replace(/@/g, "");
		if (!text || text.length > IZZI_SAY_BANNER_TEXT_LIMIT) {
			context.channel?.sendMessage(`Summoner **${author.username}**, ` +
			`Please enter a valid message between 1 and ${IZZI_SAY_BANNER_TEXT_LIMIT} characters.`);
			return;
		}

		const msg = await context.channel?.messages.fetch(context.id);
		if (!msg?.deletable) {
			text += " (To hide your original message, Izzi requires the `MANAGE_MESSAGES` permissions).";
		}
		context.channel?.sendMessage(text);
		if (msg && msg.deletable) {
			msg.deleteMessage();
		}
		return;
	} catch (err) {
		loggers.error("commands.basics.funCommands.izziSpeak: ERROR", err);
		return;
	}
};