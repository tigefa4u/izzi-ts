import { BaseProps } from "@customTypes/command";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

export const unlockFodders = async ({
	context,
	client,
	args,
	options
}: BaseProps) => {
	try {
		const { author } = options;
		const key = "enhlock::" + author.id;
		const lockid = Number(args[1]);
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!lockid || isNaN(lockid)) {
			await Cache.del(key);
			embed.setTitle(DEFAULT_SUCCESS_TITLE)
				.setDescription("You have succesfully reset enh lock and " +
                "all Fodders will be consumed during enchantment.");

			context.channel?.sendMessage(embed);
			return;
		}
		const result = await Cache.get(key);
		if (!result) {
			embed.setDescription("You have no fodders locked use `iz inv lock -n <name>` " +
            "to lock fodders you do not wish to consume.");
			context.channel?.sendMessage(embed);
			return;
		}
		const data = JSON.parse(result).lockcards;
		if (!data[lockid - 1]) {
			embed.setDescription("We were unable to find the lockID in your locked items");
			context.channel?.sendMessage(embed);
			return;
		}
		const removed = data.splice(lockid - 1, 1);
		if (data.length <= 0) {
			await Cache.del(key);
		} else {
			await Cache.set(key, JSON.stringify({ lockcards: data }));
		}
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Successfully unlocked **${titleCase(removed[0].name)}** Fodders, ` +
            "and will be consumed during enchantment.\n\nTo reset type `iz inv unlock`.");
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("collections.actions.unlockFodders: ERRRO", err);
		return;
	}
};
