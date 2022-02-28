import {
	AuthorProps,
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getCharacterInfo } from "api/controllers/CharactersController";
import {
	getCollection,
	updateCollection,
} from "api/controllers/CollectionsController";
import { createMarketCard } from "api/controllers/MarketsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import { DEFAULT_SUCCESS_TITLE, MARKET_COMMISSION } from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { validateMarketCard } from "..";

async function validateAndSellCard(
	params: ConfirmationInteractionParams<{ id: number; price: number }>,
	options?: ConfirmationInteractionOptions
) {
	try {
		const user = await getRPGUser({ user_tag: params.author.id }, { cached: true });
		if (!user) return;
		const collection = await getCollection({
			is_item: false,
			is_on_market: false,
			id: params.extras?.id,
		});
		if (!collection || collection.length > 0) {
			params.channel?.sendMessage(
				"We could not find the card you were looking for in your collections. :no_entry:"
			);
			return;
		}
		const cardToBeSold = collection[0];
		const marketCard = await validateMarketCard(
			cardToBeSold.id,
			params.channel,
			params.client,
			user.id,
			{ duplicateError: true }
		);
		if (marketCard) return;
		const characterInfo = await getCharacterInfo({
			ids: [ cardToBeSold.character_id ],
			rank: cardToBeSold.rank,
		});
		if (options?.isConfirm) {
			await updateCollection({ id: cardToBeSold.id }, { is_on_market: true });
			await createMarketCard({
				user_id: cardToBeSold.user_id,
				collection_id: cardToBeSold.id,
				price: params.extras?.price || 1000,
			});
			const desc = `You have successfully posted your __${titleCase(
				cardToBeSold.rank
			)}__ **Level ${cardToBeSold.character_level} ${titleCase(
				characterInfo?.name || ""
			)}** for sale on the Global Market.`;
			const embed = createEmbed()
				.setTitle(DEFAULT_SUCCESS_TITLE)
				.setDescription(desc);
			params.channel?.sendMessage(embed);
			return;
		}
		return Object.assign(
			{},
			{
				...characterInfo,
				character_level: cardToBeSold.character_level,
			}
		);
	} catch (err) {
		loggers.error("modules.commands.rpg.market.shop.sell.validateAndSellCard(): something went wrong", err);
		return;
	}
}

export const sellCard = async ({
	context,
	client,
	author,
	args,
}: Omit<BaseProps, "options"> & { author: AuthorProps }) => {
	try {
		const cooldownCommand = "sell-card";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage("You can use this command again after a minute.");
			return;
		}
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const sellingPrice = Number(args.shift());
		if (!sellingPrice || isNaN(sellingPrice)) return;
		const params = {
			extras: {
				id,
				price: sellingPrice,
			},
			channel: context.channel,
			client,
			author,
		};
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			validateAndSellCard,
			(data, opts) => {
				if (data) {
					const commission = Math.floor(sellingPrice * MARKET_COMMISSION);
					const totalCost = sellingPrice - commission;
					const desc = `Are you sure you want to sell your __${titleCase(
						data.rank || ""
					)}__ **Level ${data.character_level} ${titleCase(
						data.name || ""
					)}** on the Global Market? You will receive __${totalCost}__ ${
						emoji.gold
					}`;
					embed = createConfirmationEmbed(author, client)
						.setDescription(desc)
						.setThumbnail(data.filepath || client.user?.displayAvatarURL() || "");
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.delete();
				}
			}
		);
		if (!buttons) return;

		embed.setButtons(buttons);
		setCooldown(author.id, cooldownCommand);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.market.sell.sellCard(): something went wrong",
			err
		);
		return;
	}
};
