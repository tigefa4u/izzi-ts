import { DzFuncProps } from "@customTypes/darkZone";
import { updateDzProfile } from "api/controllers/DarkZoneController";
import { getDzTeam } from "api/controllers/DarkZoneTeamsController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { DEFAULT_ERROR_TITLE } from "helpers/constants/constants";
import loggers from "loggers";

export const selectDzTeam = async ({ options, client, context, dzUser }: DzFuncProps) => {
	try {
		const { author } = options;
		const dzTeam = await getDzTeam(author.id);
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!dzTeam) {
			embed.setDescription(`Summoner **${author.username}**, You do not have a valid ` +
            "Dark Zone Team. Use `iz dz tm set <#ID> <position>` to set a team before selecting.");
			context.channel?.sendMessage(embed);
			return;
		}
		await updateDzProfile({ user_tag: author.id }, { selected_team_id: dzTeam.id });
		context.channel?.sendMessage("Successfully selected Dark Zone Team to fight along side you! " + emoji.dance);
		return;
	} catch (err) {
		loggers.error("selectDzTeam: ERROR", err);
		return;
	}
};