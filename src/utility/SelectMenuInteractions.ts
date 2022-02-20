import { ChannelProp } from "@customTypes";
import { SelectMenuOptions } from "@customTypes/selectMenu";
import { createSelectMenu } from "commons/selectMenu";
import { MessageActionRow } from "discord.js";
import { generateUUID, interactionFilter, verifyFilter } from "helpers";
import loggers from "loggers";

export const selectionInteraction = async <P>(
	channel: ChannelProp,
	authorId: string,
	options: SelectMenuOptions,
	params: P,
	callback: (params: P, value: string) => void
) => {
	try {
		const customId = "select_" + generateUUID(4);
		const selectMenu = new MessageActionRow().addComponents(
			createSelectMenu(customId, options)
		);
		const collectorFilter = interactionFilter(authorId, verifyFilter, { customId });

		const collector = channel?.createMessageComponentCollector({
			filter: collectorFilter,
			maxComponents: 1,
			max: 1
		});

		collector?.on("collect", async (interaction) => {
			if (!interaction.isSelectMenu()) return;
			interaction.deferUpdate();
			callback(params, interaction.values[0]);
			return;
		});
		return selectMenu;
	} catch (err) {
		loggers.error("utility.SelectMenuInteractions.selectionInteraction(): something went wrong", err);
		return;
	}
};