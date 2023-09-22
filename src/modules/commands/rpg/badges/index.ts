import { BaseProps } from "@customTypes/command";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { badges, redeemBadge } from "./redeem";
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
			.addFields(badges.map((b) => ({
				name: `ID: ${b.id} | ${b.name} ${b.emoji}`,
				value: b.description
			})))
			.setHideConsoleButtons(true);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("rpg.badges: ERROR", err);
		return;
	}
};