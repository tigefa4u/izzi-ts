import { BaseProps } from "@customTypes/command";
import { getDGTeam } from "api/controllers/DungeonsController";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { DEFAULT_ERROR_TITLE } from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

export const viewDGBattleLog = async ({
	context,
	client,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const dgTeam = await getDGTeam(author.id);
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!dgTeam) {
			embed.setDescription(
				`Summoner **${author.username}**, You do not have a DG Team! Create a DG Team ` +
          "using ``iz dg create <name>``"
			);

			context.channel?.sendMessage(embed);
			return;
		} else if (!dgTeam.metadata.attacked && !dgTeam.metadata.defended) {
			embed.setDescription(
				`Summoner **${author.username}**, There are ` +
          "currently no Battle Logs. Attack a player to view logs!"
			);

			context.channel?.sendMessage(embed);
			return;
		}
		let logDesc = "";
		const attackLog = dgTeam.metadata.attacked;
		const defenseLog = dgTeam.metadata.defended;
		if (attackLog) {
			logDesc =
        logDesc +
        `**__Attack Log__**\n**Attacked:** ${attackLog.username} (${
        	attackLog.user_tag
        })\n**Outcome:** ${titleCase(attackLog.outcome)}\n**Rank:** ${titleCase(
        	attackLog.rank
        )} ${emojiMap(attackLog.rank)}\n**Exp gain/lose:** ${attackLog.points}\n\n`;
		}
		if (defenseLog) {
			logDesc =
        logDesc +
        `**__Defense Log__**\n**Defended Against:** ${defenseLog.username} (${
        	defenseLog.user_tag
        })\n**Outcome:** ${titleCase(defenseLog.outcome)}\n**Rank:** ${titleCase(
        	defenseLog.rank
        )} ${emojiMap(defenseLog.rank)}\n**Exp gain/lose:** ${defenseLog.points}`;
		}
		embed
			.setTitle(`DG Battle Logs ${emoji.crossedswords}`)
			.setDescription("View your latest battle logs.\n\n" + logDesc);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("dungon.v2.battleLog.viewDGBattleLog: ERROR", err);
		return;
	}
};
