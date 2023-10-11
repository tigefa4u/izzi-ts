import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getMarriage } from "api/controllers/MarriagesController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import { DOT } from "helpers/constants/constants";
import { DMUser } from "helpers/directMessages";
import loggers from "loggers";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";

const getListOfGifts = () => {
	return [
		{
			name: "confession of love 💌",
			price: 1000,
		},
		{
			name: "key to heart 🗝️",
			price: 2000,
		},
		{
			name: "dog 🐕",
			price: 5000,
		},
		{
			name: "cat 🐈",
			price: 5000,
		},
		{
			name: "poodle 🐩",
			price: 10000,
		},
		{
			name: "hedgehog 🦔",
			price: 5000,
		},
		{
			name: "cow 🐮",
			price: 5000,
		},
		{
			name: "fox 🦊",
			price: 8000,
		},
		{
			name: "goat 🐐",
			price: 2000,
		},
		{
			name: "fish 🐠",
			price: 2000,
		},
		{
			name: "ice cream 🍨",
			price: 1000,
		},
		{
			name: "pizza 🍕",
			price: 1000,
		},
		{
			name: "hamburger 🍔",
			price: 1000,
		},
		{
			name: "cupcake 🧁",
			price: 1000,
		},
		{
			name: "cookie 🍪",
			price: 1000,
		},
		{
			name: "peach 🍑",
			price: 1000,
		},
		{
			name: "doughnut 🍩",
			price: 1000,
		},
		{
			name: "cake 🍰",
			price: 1000,
		},
		{
			name: "onigiri 🍙",
			price: 1000,
		},
		{
			name: "wine 🍷",
			price: 2500,
		},
		{
			name: "champagne 🥂",
			price: 2500,
		},
		{
			name: "bouquet 💐",
			price: 1500,
		},
		{
			name: "cherry blossom 🌸",
			price: 1500,
		},
		{
			name: "rose 🌹",
			price: 1000,
		},
		{
			name: "dress 👗",
			price: 10000,
		},
		{
			name: "LV handbag 👜",
			price: 20000,
		},
		{
			name: "kimono 👘",
			price: 12500,
		},
		{
			name: "bikini 👙",
			price: 8570,
		},
		{
			name: "red heels 👠",
			price: 6500,
		},
		{
			name: "sneakers 👟",
			price: 7000,
		},
		{
			name: "crown 👑",
			price: 25000,
		},
		{
			name: "house 🏠",
			price: 50000,
		},
		{
			name: "vacation home 🏡",
			price: 150000,
		},
		{
			name: "aeroplane ✈️",
			price: 300000,
		},
		{
			name: "motorboat 🛥️",
			price: 300000,
		},
		{
			name: "the world (za worldo) 🌎",
			price: 100000000,
		},
	];
};

const confirmAndSendGift = async (
	params: ConfirmationInteractionParams<{
    item: { price: number; name: string };
  }>,
	options?: ConfirmationInteractionOptions
) => {
	const item = params.extras?.item;
	if (!item) return;
	const { author, channel } = params;
	if (options?.isConfirm) {
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;

		if (!user.is_married) {
			channel?.sendMessage(
				`Summoner **${author.username}**, You must be married to purchase a gift.`
			);
			return;
		}
		if (user.gold < item.price) {
			channel?.sendMessage(
				`Summoner **${author.username}**, ` +
          "You do not have sufficient gold to purchase this gift. " +
          `__${numericWithComma(item.price)}__ ${emoji.gold} Gold needed`
			);
			return;
		}
		const marriage = await getMarriage({ user_tag: user.user_tag });
		if (!marriage) {
			channel?.sendMessage(
				`Summoner **${author.username}**, You must be married to purchase a gift.`
			);
			await updateRPGUser({ user_tag: author.id }, { is_married: false });
			return;
		}

		const giftEmbed = createEmbed(author, params.client)
			.setTitle(`Gift Received ${emoji.heart}`)
			.setDescription(
				`Hello Summoner ${marriage.married_to_username}\nYour partner **${
					author.username || ""
				}** has sent you a gift,\n**${DOT} ${titleCase(item.name)}**`
			)
			.setHideConsoleButtons(true);

		user.gold = user.gold - item.price;
		await Promise.all([
			updateRPGUser({ user_tag: author.id }, { gold: user.gold }),
			DMUser(params.client, giftEmbed, marriage.married_to),
		]);
		const embed = createEmbed(author, params.client).setTitle(`Gift Sent ${emoji.heart}`)
			.setDescription(`Summoner **${author.username}**, ` +
            `You have sent **${titleCase(item.name)}** to **${marriage.married_to_username}**`)
			.setHideConsoleButtons(true);

		params.channel?.sendMessage(embed);
		return;
	}
	return item;
};

export const giftPartner = async ({
	context,
	client,
	options,
	args,
}: BaseProps) => {
	try {
		const { author } = options;
		const id = Number(args.shift());
		const items = getListOfGifts();
		if (!id || isNaN(id) || id <= 0) {
			const embed = createEmbed(author, client)
				.setTitle("Send Your Partner a Gift")
				.setDescription(
					`${items.map(
						(it, i) =>
							`#${i + 1} | **${titleCase(it.name)}** | __${numericWithComma(
								it.price
							)}__ Gold ${emoji.gold}`
					).join("\n")}`
				)
				.setHideConsoleButtons(true)
				.setFooter({
					text: "To send a gift type `iz gift <#ID>`",
					iconURL: author.displayAvatarURL(),
				});

			context.channel?.sendMessage(embed);
			return;
		}
		const item = items[id - 1];
		if (!item) {
			context.channel?.sendMessage(
				"We could not find the gift you were looking for. Please enter a valid ID."
			);
			return;
		}
		let sentMessage: Message;
		let embed = createEmbed().setHideConsoleButtons(true);
		const button = await confirmationInteraction(
			context.channel,
			author.id,
			{
				channel: context.channel,
				author,
				client,
				extras: { item },
			},
			confirmAndSendGift,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client)
						.setDescription(
							`Are you sure you want to gift **${titleCase(
								data.name
							)}** to your partner for __${numericWithComma(
								data.price
							)}__ Gold ${emoji.gold}`
						)
						.setHideConsoleButtons(true);
				}
				if (opts?.isDelete) {
					sentMessage.deleteMessage();
				}
			}
		);

		if (!button) return;
		embed.setButtons(button);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("commands.rpg.marriage.gift.giftPartner: ERROR", err);
		return;
	}
};
