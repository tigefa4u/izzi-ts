import { BaseProps } from "@customTypes/command";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { DOT } from "helpers/constants";
import loggers from "loggers";

export const viewTourneySettings = async ({
	context,
	options,
	client
}: BaseProps) => {
	try {
		const { author } = options;
		if (!context.guild?.id) return;
		const key = "tourney::" + context.guild.id;
		const embed = createEmbed(author, client)
			.setTitle(`${emoji.crossedswords} Tournament Settings ${emoji.crossedswords}`);
		const settings = await Cache.get(key);
		if (!settings) {
			embed.setDescription("There are currently no Tournament Settings.\n" +
            "Use ``iz tourney toggle`` to toggle Tournament Mode.");
			context.channel?.sendMessage(embed);
			return;
		}

		const data = JSON.parse(settings);
		embed.setDescription(`Tournament Settings for **${context.guild.name}** are shown below.\n\n` +
        `${Object.keys(data).map((k) => `${DOT} ${data[k]}`).join("\n")}`);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("tournament.actions.view.viewTourneySettings: ERROR", err);
		return;
	}
};