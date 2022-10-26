import { BaseProps } from "@customTypes/command";
import { createEmbed } from "commons/embeds";
import { GUIDE_DOCS } from "environment";
import { CONSOLE_BUTTONS } from "helpers/constants";
import loggers from "loggers";
import { customButtonInteraction } from "utility/ButtonInteractions";

export const viewChangeLogs = ({ context, options, client }: BaseProps) => {
	try {
		const author = options.author;
		const embed = createEmbed(author, client).setTitle("Change Logs")
			.setDescription("View a detailed description of Patch notes and updates on izzi.");

		const buttons = customButtonInteraction(
			context.channel,
			[
				{
					label: CONSOLE_BUTTONS.CHANGE_LOGS.label,
					params: { id: CONSOLE_BUTTONS.CHANGE_LOGS.id },
					url: `${GUIDE_DOCS}/change-logs`
				}
			],
			author.id,
			() => {
				return;
			},
			() => {
				return;
			},
			true,
			10
		);

		if (buttons) {
			embed.setButtons(buttons).setHideConsoleButtons(true);
		}
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.basic.changelogs.viewChangeLogs(): something went wrong", err);
		return;
	}
};