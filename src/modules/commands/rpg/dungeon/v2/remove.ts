import { BaseProps } from "@customTypes/command";
import { delDGTeam, getDGTeam } from "api/controllers/DungeonsController";
import { createEmbed } from "commons/embeds";
import { DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";

export const removeDGTeam = async ({ context, options, client }: BaseProps) => {
	try {
		const author = options.author;
		const dgTeam = await getDGTeam(author.id);
		if (dgTeam) {
			await delDGTeam(author.id);
		}
		const embed = createEmbed(author, client).setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Successfully deleted DG Team${dgTeam ? ` **__${dgTeam.team.name}__**` : ""}`);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("dungeon.v2.remove.removeDGTeam: ERROR", err);
		return;
	}
};