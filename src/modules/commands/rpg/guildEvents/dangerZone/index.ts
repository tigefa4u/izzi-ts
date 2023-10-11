import { BaseProps } from "@customTypes/command";
import { updateGuildEvent } from "api/controllers/GuildEventsController";
import { delRaidPing } from "api/models/GuildEvents";
import { createEmbed } from "commons/embeds";
import { getMemberPermissions } from "helpers";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants/constants";
import loggers from "loggers";

export const resetGuildEvents = async ({ client, options, context, args }: BaseProps) => {
	try {
		const guildId = context.guild?.id;
		if (!guildId) return;
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
		const id = Number(args.shift());
		const promises = [];
		const updateParams = { guild_id: guildId };
		if (!id || isNaN(id)) {
			promises.push(delRaidPing(guildId));
		} else {
			Object.assign(updateParams, { id });
		}
		promises.push(updateGuildEvent(updateParams, { is_deleted: true }));
		await Promise.all(promises);
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription("Successfully reset all guild events");
        
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("commands.rpg.guildEvents.dangerZone.resetGuildEvents: ERROR", err);
		return;
	}
};