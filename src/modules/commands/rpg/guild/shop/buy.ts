import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import {
	createGuildItem,
	getGuildItem,
	updateGuildItem,
} from "api/controllers/GuildItemsController";
import { getGuildMarketItem } from "api/controllers/GuildMarketsController";
import { updateGuild } from "api/controllers/GuildsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	GUILD_MARKET_IDS,
	MAX_GUILD_ITEMS_PURCHASABLE,
} from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { verifyMemberPermissions } from "..";

async function validateAndProcessPurchase(
	params: ConfirmationInteractionParams<{
    id: number;
    total: number;
    context: BaseProps["context"];
    quantity: number;
    market_item_id: number;
	name: string;
  }>,
	options?: ConfirmationInteractionOptions
) {
	const id = params.extras?.id;
	const ctx = params.extras?.context;
	const author = params.author;
	if (
		!id ||
    !ctx ||
    !params.extras?.total ||
    !params.extras?.quantity ||
    !params.extras?.market_item_id
	)
		return;
	const validGuild = await verifyMemberPermissions({
		context: ctx,
		author: params.author,
		params: [ "is_leader", "is_vice_leader" ],
		isOriginServer: true,
		isAdmin: true,
		extras: { user_id: id },
	});
	if (!validGuild) return;
	const embed = createEmbed()
		.setTitle(DEFAULT_ERROR_TITLE)
		.setAuthor({
			name: author.username,
			iconURL: author.displayAvatarURL(),
		})
		.setThumbnail(params.client.user?.displayAvatarURL() || "");
	if (validGuild.guild.gold < params.extras.total) {
		embed.setDescription(
			"Your guild does not have enough gold to purchase this item!"
		);
		ctx.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		validGuild.guild.gold = validGuild.guild.gold - params.extras.total;
		const [ _, duplicateItem ] = await Promise.all([
			updateGuild({ id: validGuild.guild.id }, { gold: validGuild.guild.gold }),
			getGuildItem({
				id: params.extras.market_item_id,
				guild_id: validGuild.guild.id,
			}),
		]);
		if (duplicateItem) {
			duplicateItem.quantity = duplicateItem.quantity + params.extras.quantity;
			await updateGuildItem(
				{ id: duplicateItem.id },
				{ quantity: duplicateItem.quantity }
			);
		} else {
			await createGuildItem({
				item_id: params.extras.market_item_id,
				quantity: params.extras.quantity || 1,
				guild_id: validGuild.guild.id,
			});
		}
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`You have successfully purchased __${
					params.extras.quantity
				}x__ **${titleCase(
					duplicateItem?.name || params.extras.name
				)}** from the Global Guild Market!`
			);
		params.channel?.sendMessage(embed);
		return;
	}

	return validGuild;
}

export const buyItem = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const cooldownCommand = "buy-item";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage(
				"You can use this command again after a minute."
			);
			return;
		}
		const id = Number(args.shift());
		if (!id || isNaN(id) || !GUILD_MARKET_IDS.includes(id)) return;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const marketItem = await getGuildMarketItem({ id });
		let embed = createEmbed().setTitle(DEFAULT_ERROR_TITLE).setAuthor({
			name: author.username,
			iconURL: author.displayAvatarURL(),
		});
		if (!marketItem) {
			embed.setDescription("We could not find the item you were looking for");
			context.channel?.sendMessage(embed);
			return;
		}
		let quantity = Number(args.shift());
		if (isNaN(quantity) || quantity <= 0 || quantity > MAX_GUILD_ITEMS_PURCHASABLE) quantity = 1;
		const totalCost = marketItem.price * quantity;
		const params = {
			channel: context.channel,
			author,
			client,
			extras: {
				context,
				market_item_id: marketItem.id,
				id: user.id,
				total: totalCost,
				quantity,
				name: marketItem.name
			},
		};
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			validateAndProcessPurchase,
			(data, opts) => {
				if (data) {
					const attachment = createAttachment(marketItem.filepath, "item.jpg");
					embed = createConfirmationEmbed(author, client)
						.setDescription(
							`Are you sure, you'd like to purchase __${quantity}x__ ${titleCase(
								marketItem.name
							)} for __${totalCost}__ Gold? ${emoji.gold}`
						)
						.attachFiles([ attachment ])
						.setThumbnail("attachment://item.jpg");
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.deleteMessage();
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
			"modules.commands.rpg.guild.shop.buy.buyItem(): something went wrong",
			err
		);
		return;
	}
};
