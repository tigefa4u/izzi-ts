import { AuthorProps, ChannelProp } from "@customTypes";
import { CharacterCardProps } from "@customTypes/characters";
import { PageProps } from "@customTypes/pagination";
import {
	SelectMenuCallbackParams,
	SelectMenuOptions,
} from "@customTypes/selectMenu";
import { SkinProps } from "@customTypes/skins";
import { createSkinCollection } from "api/controllers/SkinCollectionController";
import { getSkinByCharacterId } from "api/controllers/SkinsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client, Message, MessageEmbed } from "discord.js";
import emoji from "emojis/emoji";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import { clientSidePagination } from "helpers/pagination";
import loggers from "loggers";
import { titleCase } from "title-case";
import {
	customButtonInteraction,
	paginatorInteraction,
} from "utility/ButtonInteractions";
import { selectionInteraction } from "utility/SelectMenuInteractions";

type Props = {
  author: AuthorProps;
  channel: ChannelProp;
  character: CharacterCardProps;
  client: Client;
};
export const showCardSkins = async ({
	author,
	channel,
	character,
	client,
}: Props) => {
	try {
		const embed = createEmbed(author)
			.setTitle(`${titleCase(character.name)} Skin Collections`)
			.setDescription(`View available skins for ${titleCase(character.name)}?`);

		const characterSkins = await getSkinByCharacterId({ character_id: character.id, });
		if (!characterSkins || characterSkins.length <= 0) return;
		const selectMenuOptions = {
			menuOptions: [
				{
					label: "Yes",
					value: "yes",
				},
			],
		} as SelectMenuOptions;

		const buttons = await selectionInteraction(
			channel,
			author.id,
			selectMenuOptions,
			{
				author,
				channel,
				client,
				extras: {
					characterSkins,
					characterName: character.name,
				},
			},
			handleShowSkin
		);

		if (buttons) {
			embed.setButtons(buttons);
		}
		channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.cardinfo.skinInfo.showCardSkins(): Something went wrong",
			err
		);
		return;
	}
};

const handleShowSkin = async (
	params: SelectMenuCallbackParams<{
    characterSkins: SkinProps[];
    characterName: string;
  }>,
	value?: string
) => {
	const characterSkins = params.extras?.characterSkins;
	if (!value || !characterSkins) return;
	const pageFilter = {
		currentPage: 1,
		perPage: 1,
	};
	let embed = createEmbed(params.author, params.client).setTitle(
		titleCase(params.extras?.characterName || "No Name") + " Skin Collections"
	);

	let sentMessage: Message;

	const buttons = await paginatorInteraction(
		params.channel,
		params.author.id,
		{ characterSkins },
		pageFilter,
		fetchCharacterSkins,
		async (data, opts) => {
			if (data) {
				embed = await prepareDescEmbed({
					embed,
					data: data.data,
					channel: params.channel,
					author: params.author,
				});
			}
			if (opts?.isEdit) {
				sentMessage.editMessage(embed);
			}
			if (opts?.isDelete) {
				sentMessage.deleteMessage();
			}
		}
	);

	if (buttons) {
		if (embed.buttons) {
			embed.buttons.setComponents(
				...embed.buttons.components,
				...buttons.components
			);
		} else {
			embed.setButtons(buttons);
		}
	}
	const msg = await params.channel?.sendMessage(embed);
	if (msg) {
		sentMessage = msg;
	}
	return;
};

type DescProps = {
  embed: MessageEmbed;
  data: SkinProps;
  channel: ChannelProp;
  author: AuthorProps;
};
async function prepareDescEmbed({ embed, data, channel, author }: DescProps) {
	const attachment = createAttachment(
		data.metadata.assets?.silver?.medium?.filepath || "",
		"card.jpg"
	);
	embed
		.setDescription(
			`**Skin Name:** ${titleCase(data.name)}\n**Price:** ${data.price} ${
				emoji.blueorb
			}\n**Popularity:** :gem:`
		)
		.setImage("attachment://card.jpg")
		.attachFiles([ attachment ]);

	const buttons = await customButtonInteraction(
		channel,
		[
			{
				label: "Purchase",
				emoji: emoji.blueorb,
				params: { skinDetails: data },
			},
		],
		author.id,
		({ skinDetails }) => {
			handlePurchaseSkin({
				data: skinDetails,
				author,
				channel
			});
			return;
		},
		() => {
			return;
		}
	);
	if (buttons) {
		if (embed.buttons) {
			embed.buttons.components[0].setCustomId(
				buttons.components[0].customId || "purchase"
			);
			embed.buttons.setComponents(embed.buttons.components);
		} else {
			embed.setButtons(buttons);
		}
	}

	return embed;
}

const fetchCharacterSkins = async (
	params: { characterSkins: SkinProps[] },
	filter: PageProps
) => {
	try {
		const result = clientSidePagination(
			params.characterSkins,
			filter.currentPage,
			filter.perPage
		);
		return {
			data: result[0],
			metadata: {
				totalCount: params.characterSkins.length,
				totalPages: params.characterSkins.length,
				...filter,
			},
		};
	} catch (err) {
		loggers.error(
			"cardinfo.skinInfo.fetchCharacterSkins(): something went wrong",
			err
		);
		return;
	}
};

const handlePurchaseSkin = async (params: {
  data: SkinProps;
  author: AuthorProps;
  channel: ChannelProp;
}) => {
	try {
		const { data, author, channel } = params;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const embed = createEmbed(author)
			.setThumbnail(data.metadata.assets?.silver.small.filepath || data.filepath)
			.setTitle(DEFAULT_ERROR_TITLE);
		if (user.orbs < data.price) {
			embed.setDescription(
				"You do not have sufficient **Blue Orbs** " +
          `to purchase this skin **[${user.orbs} / ${data.price}]** ${emoji.blueorb}`
			);
			channel?.sendMessage(embed);
			return;
		}
		user.orbs = user.orbs - data.price;
		await Promise.all([
			updateRPGUser({ user_tag: user.user_tag }, { orbs: user.orbs }),
			createSkinCollection({
				user_tag: user.user_tag,
				skin_id: data.id,
				is_selected: false,
				character_id: data.character_id
			})
		]);
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`You have spent __${data.price}__ Blue Orbs ${emoji.blueorb} ` +
            `and successfully purchased **${titleCase(data.name)}**`);
		channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"cardinfo.skinInfo.handlePurchaseSkin(): something went wrong",
			err
		);
		return;
	}
};
