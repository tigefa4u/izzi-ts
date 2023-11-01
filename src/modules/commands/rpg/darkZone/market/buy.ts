import { DzFuncProps } from "@customTypes/darkZone";
import { createEmbed } from "commons/embeds";
import { numericWithComma } from "helpers";
import { DEFAULT_ERROR_TITLE } from "helpers/constants/constants";
import { DZ_INVENTORY_SLOTS_PER_LEVEL, DZ_STARTER_INVENTORY_SLOTS } from "helpers/constants/darkZone";
import loggers from "loggers";
import { purchaseCard } from "../../market/shop/buy";

export const buyDzCardFromMarket = async (params: DzFuncProps) => {
	try {
		const { dzUser } = params;
		const maxSlots = (dzUser.level * DZ_INVENTORY_SLOTS_PER_LEVEL) + 
        (DZ_STARTER_INVENTORY_SLOTS - DZ_INVENTORY_SLOTS_PER_LEVEL);

		const embed = createEmbed(params.options.author, params.client).setTitle(DEFAULT_ERROR_TITLE)
			.setHideConsoleButtons(true);
		if (dzUser.inventory_count >= maxSlots) {
			embed.setDescription(
				`Summoner **${params.options.author.username}**, You have already reached the maximum number of ` +
          `cards you can hold in your inventory **[${numericWithComma(
          	dzUser.inventory_count
          )} / ${numericWithComma(maxSlots)}]**. ` +
          `Level up to increase the limit! Current level: ${dzUser.level}`
			);
			params.context.channel?.sendMessage(embed);
			return;
		}
		purchaseCard({
			client: params.client,
			args: params.args,
			context: params.context,
			isDarkZone: true,
			author: params.options.author
		});
		return;
	} catch (err) {
		loggers.error("buyDzCardFromMarket: ERROR", err);
		return;
	}
};