import { BaseProps } from "@customTypes/command";
import Cache from "cache";
import { Message } from "discord.js";
import { prepareAndSendConsoleMenu } from "implementations/consoleButtons";
import loggers from "loggers";
import { titleCase } from "title-case";

const raids: { [key: string]: string } = {
	i: "immortal",
	e: "easy",
	m: "medium",
	h: "hard"
};
export const console = async ({ client, context, options, args }: BaseProps) => {
	try {
		const cmd = args.shift();
		const key = "rconfig::" + options.author.id;
		if (cmd === "rconfig") {
			const difficulty = args.shift() || "e";
			if (![ "i", "e", "m", "h" ].includes(difficulty)) {
				context.channel?.sendMessage(
					"Please provide any one of these values ``[e, m, h, i]``"
				);
				return;
			}
			Cache.set(key, JSON.stringify({ difficulty: raids[difficulty] }));
			context.channel?.sendMessage("Successfully set raid spawn " +
            `configuration to __${titleCase(raids[difficulty])}__ difficulty.`);
			return;
		} else if (cmd === "reset") {
			Cache.del(key);
			context.channel?.sendMessage("Successfully reset raid configuration");
			return;
		}
		prepareAndSendConsoleMenu({
			channel: context.channel,
			user_tag: options.author.id,
			client,
			id: "",
			message: context as Message
		});
		return;
	} catch (err) {
		loggers.error("rpg.console(): something went wrong", err);
		return;
	}
};