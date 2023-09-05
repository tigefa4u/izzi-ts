import { BaseProps } from "@customTypes/command";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { redeemBadge } from "./redeem";
import { subcommands } from "./subcommands";

export const badge = async ({ context, client, args, options }: BaseProps) => {
	try {
		const { author } = options;
		const cmd = filterSubCommands(args.shift() || "view", subcommands);
		if (cmd === "redeem") {
			redeemBadge({
				client,
				context,
				options,
				args
			});
			return;
		}
		/** Need to change the logic later on */
		const embed = createEmbed(author, client).setTitle("Profile Badges")
			.setDescription("To redeem a badge type `iz badge redeem <ID>`")
			.addFields([ {
				name: `Heartseeker ${emoji.heartseekerbadge} | ID 1`,
				value: "Must have all 3 cards from Heartseeker Event or married for 2 or more years to redeem."
			} ])
			.setHideConsoleButtons(true);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("rpg.badges: ERROR", err);
		return;
	}
};