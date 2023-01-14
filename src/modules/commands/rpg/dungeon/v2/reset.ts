import { BaseProps } from "@customTypes/command";
import { getDGTeam, updateDGTeam } from "api/controllers/DungeonsController";
import { createEmbed } from "commons/embeds";
import { DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";

export const resetDGTeam = async ({ options, context, client }: BaseProps) => {
	try {
		const author = options.author;
		const embed = createEmbed(author, client);
		const dgTeam = await getDGTeam(author.id);
		if (dgTeam) {
			dgTeam.team.metadata = [ 1, 2, 3 ].map((n) => ({
				collection_id: null,
				position: n,
				itemName: null,
				item_id: null,
				itemPosition: n
			}));
			await updateDGTeam(author.id, {
				team: dgTeam.team,
				metadata: {
					...dgTeam.metadata,
					isValid: false
				} 
			});
		}
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Successfully reset DG Team${dgTeam ? ` **__${dgTeam.team.name}__**` : ""}`);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("dungeon.v2.reset.resetDGTeam: ERROR", err);
		return;
	}
};