import { ChannelProp } from "@customTypes";
import { SelectMenuOptions } from "@customTypes/selectMenu";
import { createSelectMenu } from "commons/selectMenu";
import { MessageActionRow } from "discord.js";
import { generateUUID, interactionFilter, verifyFilter } from "helpers";
import loggers from "loggers";
import { initLoggerContext, setLoggerContext } from "loggers/context";

export const selectionInteraction = async <P>(
	channel: ChannelProp,
	authorId: string,
	options: SelectMenuOptions,
	params: P,
	callback: (params: P, value: string) => void,
	extras?: {
		max: number;
	}
) => {
	try {
		if (options.menuOptions.length <= 0) {
			throw new Error("Invalid select menu options received: -> " + JSON.stringify(options));
		}
		const customId = "select_" + generateUUID(4);
		const selectMenu = new MessageActionRow().addComponents(
			createSelectMenu(customId, options)
		);
		const collectorFilter = interactionFilter(authorId, verifyFilter, { customId });

		const collector = channel?.createMessageComponentCollector({
			filter: collectorFilter,
			maxComponents: extras?.max || 1,
			max: extras?.max || 1
		});

		collector?.on("collect", async (interaction) => {
			if (!interaction.isSelectMenu()) return;
			initLoggerContext(() => {
				setLoggerContext({
					trackingId: generateUUID(10),
					userTag: interaction.user.id
				});
			});
			await interaction.deferUpdate();
			loggers.info(`Select Menu interacted by user -> ${interaction.user.id} value: ${interaction.values[0]}`);
			callback(params, interaction.values[0]);
			return;
		});
		return selectMenu;
	} catch (err) {
		loggers.error("utility.SelectMenuInteractions.selectionInteraction: ERROR", err);
		return;
	}
};