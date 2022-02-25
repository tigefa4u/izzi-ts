import {
	AuthorProps,
	ChannelProp,
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import {
	createCollection,
	getCollection,
} from "api/controllers/CollectionsController";
import { getItemById } from "api/controllers/ItemsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";

async function validateItem(
	id: number,
	channel: ChannelProp,
	client: ConfirmationInteractionParams<undefined>["client"],
	user_id: number
) {
	const item = await getItemById({ id });
	const embed = createEmbed()
		.setTitle(DEFAULT_ERROR_TITLE)
		.setThumbnail(client.user?.displayAvatarURL() || "");
	if (!item) {
		loggers.info("Item not found for ID: " + id);
		embed.setDescription("We could not find the item you were looking for.");

		channel?.sendMessage(embed);
		return;
	}
	const duplicateItem = await getCollection({
		is_item: true,
		is_on_market: false,
		user_id: user_id,
		item_id: id,
	});
	if (duplicateItem && duplicateItem.length > 0) {
		loggers.info(
			"Duplicate item for item ID: " +
        id +
        ", DUP ID: " +
        duplicateItem[0].id +
        " for user: " +
        user_id
		);
		embed.setDescription(
			"You already own this item. Equip the item to use it in battle."
		);
		channel?.sendMessage(embed);
		return;
	}
	return item;
}

async function validateAndPurchaseItem(
	params: ConfirmationInteractionParams<{ id: number }>,
	options?: ConfirmationInteractionOptions
) {
	const user = await getRPGUser({ user_tag: params.author.id });
	if (!user) return;
	const item = await validateItem(
		params.extras?.id || 0,
		params.channel,
		params.client,
		user.id
	);
	if (!item) return;
	const embed = createEmbed()
		.setTitle(DEFAULT_ERROR_TITLE)
		.setThumbnail(params.client.user?.displayAvatarURL() || "")
		.setAuthor({
			name: params.author.username,
			iconURL: params.author.displayAvatarURL(),
		});
	if (user.gold < item.price) {
		embed.setDescription(
			"You do not have sufficient gold to purchase this item"
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		user.gold = user.gold - item.price;
		await Promise.all([
			updateRPGUser({ user_tag: user.user_tag }, { gold: user.gold }),
			createCollection({
				user_id: user.id,
				is_item: true,
				item_id: item.id,
			}),
		]);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`You have successfully purchase **${titleCase(item.name)}** for __${
					item.price
				}__ gold ${emoji.gold} from the Global Item Market.`
			);
		params.channel?.sendMessage(embed);
		return;
	}
	return item;
}

export const purchaseItem = async ({
	context,
	client,
	args,
	author,
}: Omit<BaseProps, "options"> & { author: AuthorProps }) => {
	try {
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const params = {
			client,
			author,
			channel: context.channel,
			extras: { id },
		};
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			validateAndPurchaseItem,
			(data, opts) => {
				if (data) {
					const attachment = createAttachment(data.filepath, "item.jpg");
					const desc = `Are you sure you want to purchase **${titleCase(
						data.name
					)}** for __${data.price}__ gold ${emoji.gold}`;
					embed = createConfirmationEmbed(author, client)
						.setDescription(desc)
						.setThumbnail("attachment://item.jpg")
						.attachFiles([ attachment ]);
				}
				if (opts?.isDelete) {
					sentMessage.delete();
				}
			}
		);
		if (!buttons) return;

		embed.setButtons(buttons);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.items.shop.purchaseItem(): something went wrong",
			err
		);
		return;
	}
};
