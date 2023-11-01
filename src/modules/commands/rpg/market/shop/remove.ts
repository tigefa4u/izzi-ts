import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { updateCollection } from "api/controllers/CollectionsController";
import { updateDzInv } from "api/controllers/DarkZoneInventoryController";
import { delDzMarketCard } from "api/controllers/DarkZoneMarketsController";
import { delFromMarket } from "api/controllers/MarketsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { validateMarketCard } from "..";

export const removeCardFromMarket = async ({
	context,
	client,
	args,
	author,
	isDarkZone
}: Omit<BaseProps, "options"> & { author: AuthorProps; isDarkZone?: boolean; }) => {
	try {
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const marketCard = await validateMarketCard(
			id,
			context.channel,
			client,
			user.id,
			{
				notFoundError: true,
				isDarkZone,
				user_tag: author.id 
			}
		);
		const embed = createEmbed(author).setTitle(DEFAULT_ERROR_TITLE);
		let condition = marketCard?.user_id !== user.id;
		if (isDarkZone) {
			condition = marketCard?.user_tag !== author.id;
		}
		if (condition) {
			embed.setDescription("This card does not belong to you!");
			context.channel?.sendMessage(embed);
			return;
		}
		if (isDarkZone) {
			await Promise.all([
				delDzMarketCard(marketCard.id),
				updateDzInv({
					id: marketCard.collection_id,
					user_tag: author.id 
				}, { is_on_market: false })
			]);
		} else {
			await Promise.all([
				delFromMarket({ id: marketCard.id }),
				updateCollection(
					{ id: marketCard.collection_id },
					{ is_on_market: false }
				)
			]);
		}

		const desc = `You have successfully removed __${titleCase(
			marketCard.rank
		)}__ **Level ${marketCard.character_level} ${titleCase(
			marketCard.name
		)}** from the ${isDarkZone ? "Dark Zone" : "Global"} Market`;
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setThumbnail(marketCard.metadata?.assets?.small.filepath || marketCard.filepath)
			.setDescription(desc);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.market.shop.remove.removeCardFromMarket: ERROR",
			err
		);
		return;
	}
};
