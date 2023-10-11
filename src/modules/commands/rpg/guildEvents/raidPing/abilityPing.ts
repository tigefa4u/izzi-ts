import { BaseProps } from "@customTypes/command";
import { getAbilities } from "api/controllers/AbilityController";
import { getGuildEventByName, updateGuildEvent } from "api/controllers/GuildEventsController";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import { getMemberPermissions } from "helpers";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE, RAID_PING_NAME } from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

export const abilityPing = async ({ options, args, client, context }: BaseProps) => {
	try {
		if (!context.guild?.id) return;
		const abilities = args.shift();
		if (!abilities) return;
		const author = options.author;
		const isAdmin = await getMemberPermissions(context, author.id).then(
			(res) => res?.ADMINISTRATOR
		);
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!isAdmin) {
			embed.setDescription("You are not allowed to execute this command! :x:");
			context.channel?.sendMessage(embed);
			return;
		}
		const guildEvent = await getGuildEventByName({
			guild_id: context.guild.id,
			name: RAID_PING_NAME
		});
		if (!guildEvent) {
			embed.setDescription(
				`Summoner **${author.username}**, a Raid Ping or Channel ` +
          "has not been set up in this server. " +
          "Use ``iz help ge`` for more info"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (abilities === "reset" && guildEvent.metadata.abilities) {
			delete guildEvent.metadata.abilities;
			await updateGuildEvent({
				guild_id: guildEvent.guild_id,
				id: guildEvent.id 
			}, { metadata: guildEvent.metadata });

			embed.setTitle(DEFAULT_SUCCESS_TITLE)
				.setDescription("Successfully reset Raid Ping Abilities. " +
                "You will now receive pings for all raids.");

			context.channel?.sendMessage(embed);
			return;
		}
		const result = await getAbilities({ name: abilities }, {
			perPage: 100,
			currentPage: 1
		});
		if (result) {
			const abilityNames = result.data.map((d) => `${d.name} ${emojiMap(d.name)}`);
			guildEvent.metadata.abilities = abilityNames;
			embed.setTitle(DEFAULT_SUCCESS_TITLE)
				.setDescription("Successfully set Raid Ping Abilities. You will now receive pings for " +
                `${guildEvent.metadata.abilities.map((ab) => titleCase(ab)).join(", ")} Raids.`);

			await updateGuildEvent({
				guild_id: guildEvent.guild_id,
				id: guildEvent.id 
			}, { metadata: guildEvent.metadata });

			context.channel?.sendMessage(embed);
			return;
		}
		context.channel?.sendMessage(`Summoner **${author.username}**, please provide validate abilities`);
		return;
	} catch (err) {
		loggers.error("guildEvents.raidPing.abilityPing: ERROR", err);
		return;
	}
};