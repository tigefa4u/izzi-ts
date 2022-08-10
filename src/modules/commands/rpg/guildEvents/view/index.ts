import { BaseProps } from "@customTypes/command";
import { getAllGuildEvents } from "api/controllers/GuildEventsController";
import { createEmbed } from "commons/embeds";
import { DATE_OPTIONS } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

export const viewGuilldEvents = async ({
	context,
	options,
	client,
}: BaseProps) => {
	try {
		const guildId = context.guild?.id;
		if (!guildId) return;
		const author = options.author;
		const guildEvents = await getAllGuildEvents(guildId);
		if (!guildEvents) {
			context.channel?.sendMessage(
				"There are currently no guild events on this server. " +
          "Use ``iz help ge`` to know more"
			);
			return;
		}
		const embed = createEmbed(author, client)
			.setTitle("Guild Events")
			.setDescription(
				"All the Events on going on this server are shown below.\n\n"
			)
			.addFields(
				guildEvents.map((event, i) => {
					return {
						name: `#${i + 1} ${
							titleCase(event.name)
						} [Ends on ${event.end_date.toLocaleDateString(
							"en-us",
							DATE_OPTIONS
						)}] | ID: ${event.id}`,
						value: event.description
					};
				})
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"commands.rpg.guildEvents.view.viewGuildEvents(): something went wrong",
			err
		);
		return;
	}
};
