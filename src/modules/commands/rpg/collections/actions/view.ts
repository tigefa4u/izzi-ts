import { BaseProps } from "@customTypes/command";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

export const viewLockedFodders = async ({
	context,
	client,
	options
}: BaseProps) => {
	try {
		const { author } = options;
		const key = "enhlock::" + author.id;
		const result = await Cache.get(key);
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!result) {
			embed.setDescription("You have no fodders locked use `iz inv lock -n <name>` " +
            "to lock fodders you do not wish to consume.");
			context.channel?.sendMessage(embed);
			return;
		}
		const fields = JSON.parse(result).lockcards.map((c: { name: string; }, i: number) => ({
			name: titleCase(c.name),
			value: `Lock ID ${i + 1}`
		}));
		embed.setTitle("Locked Fodders")
			.setFields(fields);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("collections.actions.viewLockedFodders: ERRRO", err);
		return;
	}
};
