import { BaseProps } from "@customTypes/command";
import { createEmbed } from "commons/embeds";
import loggers from "loggers";
import { subcommands } from "../subcommands";

export const listDzCommands = async ({ context, client, options }: BaseProps) => {
	try {
		const { author } = options;
		const embed = createEmbed(author, client).setTitle("Dark Zone Commands")
			.setDescription("All commands available in the Dark Zone are listed below." +
			"\n**To see a full description of all commands use `iz help dz`**")
			.addFields(subcommands.map((sb) => {
				return {
					name: `${sb.name} ${sb.alias.length > 0 ? `(Shortcuts: ${sb.alias.join(", ")})` : ""}`,
					value: sb.description
				};
			}))
			.setHideConsoleButtons(true);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("actions.listDzCommands: ERROR", err);
		return;
	}
};