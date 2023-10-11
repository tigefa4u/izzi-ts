import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { updateCollection } from "api/controllers/CollectionsController";
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
}: Omit<BaseProps, "options"> & { author: AuthorProps }) => {
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
			{ notFoundError: true }
		);
		const embed = createEmbed(author).setTitle(DEFAULT_ERROR_TITLE);
		if (marketCard?.user_id !== user.id) {
			embed.setDescription("This card does not belong to you!");
			context.channel?.sendMessage(embed);
			return;
		}
		await delFromMarket({ id: marketCard.id });
		await updateCollection(
			{ id: marketCard.collection_id },
			{ is_on_market: false }
		);

		const desc = `You have successfully removed __${titleCase(
			marketCard.rank
		)}__ **Level ${marketCard.character_level} ${titleCase(
			marketCard.name
		)}** from the Global Market`;
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
