import { BaseProps } from "@customTypes/command";
import { updateGuild } from "api/controllers/GuildsController";
import { createEmbed } from "commons/embeds";
import { getMemberPermissions } from "helpers";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants/constants";
import loggers from "loggers";

export const updateServerName = async ({ context, options, client }: BaseProps) => {
	try {
		const { author } = options;
		if (!context.guild?.name) return;
		const isAdmin = getMemberPermissions(context, author.id).then((res) => res?.ADMINISTRATOR);
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE)
			.setHideConsoleButtons(true);
		if (!isAdmin) {
			embed.setDescription("Only the server Admin or Owner can execute this command! :x:");
			context.channel?.sendMessage(embed);
			return;
		}
		const serverName = context.guild.name;
		await updateGuild({ guild_id: context.guild.id }, { guild_name: serverName });
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Successfully updated Izzi server name to **__${serverName}__**.`);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("guildEvents.actions.updateServerName: ERROR", err);
		return;
	}
};