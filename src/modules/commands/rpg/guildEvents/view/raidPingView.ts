import { BaseProps } from "@customTypes/command";
import { getGuildEventByName } from "api/controllers/GuildEventsController";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE, RAID_PING_NAME } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

export const raidPingView = async ({ context, client, options }: BaseProps) => {
	try {
		const guildId = context.guild?.id;
		if (!guildId) return;
		const author = options.author;
		const guildEvent = await getGuildEventByName({
			guild_id: guildId,
			name: RAID_PING_NAME,
		});
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!guildEvent) {
			embed.setDescription(
				`Summoner **${author.username}**, a Raid Ping or Channel ` +
          "has not been set up in this server. " +
          "Use ``iz help ge`` for more info"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		embed
			.setTitle("Raid Ping View")
			.setDescription(
				"**All the Raid Ping configurations are shown below.**" +
          `\n\n**Channel to ping in:** <#${guildEvent.metadata.channel}>\n` +
          `**Role to ping:** @${guildEvent.metadata.role_name}` +
          `${
          	guildEvent.metadata.abilities
          		? `\n**Ability raids to ping:** ${guildEvent.metadata.abilities
          			.map((ab) => titleCase(ab))
          			.join(", ")}`
          		: ""
          }`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("guildEvents.view.raidPingView(): something went wrong", err);
		return;
	}
};
