import { AuthorProps, ChannelProp } from "@customTypes";
import { CharacterCardProps } from "@customTypes/characters";
import { BaseProps } from "@customTypes/command";
import { SelectMenuCallbackParams, SelectMenuOptions } from "@customTypes/selectMenu";
import { getCharacterInfo } from "api/controllers/CharactersController";
import { createWishlist, getWishlist } from "api/controllers/WishlistsContorller";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { groupByKey } from "utility";
import { fetchParamsFromArgs } from "utility/forParams";
import { selectionInteraction } from "utility/SelectMenuInteractions";

type Props = {
    client: Client;
    channel: ChannelProp;
    author: AuthorProps;
    character: CharacterCardProps;
}
const addCharacterToWishList = async ({ client, channel, author, character }: Props) => {
	const wlist = await getWishlist({
		user_tag: author.id,
		character_id: character.id,
		is_skin: false
	}, {
		perPage: 1,
		currentPage: 1 
	});
	const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
	if (wlist?.data && wlist.data.length > 0) {
		embed.setDescription("This character is already on your wishlist, " +
        "use ``iz wishlist`` to view all items on your wishlist");
		channel?.sendMessage(embed);
		return;
	}
	await createWishlist({
		is_skin: false,
		character_id: character.character_id,
		user_tag: author.id,
		metadata: {
			filepath: character.metadata?.assets?.small.filepath,
			name: character.name
		},
		is_random: character.is_random,
		is_referral_card: character.is_referral_card,
		is_xenex_card: character.series.toLowerCase() === "xenex" ? true : false
	});
	embed.setTitle(DEFAULT_SUCCESS_TITLE)
		.setDescription(`Successfully added **__${titleCase(character.name)}__** to your Wishlist. ` +
    "Use ``iz wishlist`` to view all the items in your wishlist.");
	channel?.sendMessage(embed);
	return;
};


const handleCharacterSelect = (
	options: SelectMenuCallbackParams<{
        cards: CharacterCardProps[];
      }>,
	value: string
) => {
	if (!options.extras?.cards) return;
	const cardsMeta = groupByKey(options.extras.cards, "name");
	const character = cardsMeta[value][0];
	addCharacterToWishList({
		client: options.client,
		channel: options.channel,
		author: options.author,
		character
	});
	return;
};

export const addToWishlist = async ({ context, args, client, options }: BaseProps) => {
	try {
		const author = options.author;
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		
		const params = fetchParamsFromArgs<{ name: string | string[] }>(args);
		if (!params.name) {
			embed.setDescription("Please provide a valid character name." +
            "\n``iz wh add -n texas``");
			context.channel?.sendMessage(embed);
			return;
		}
        
		const charaInfo = await getCharacterInfo({ name: params.name });
		if (!charaInfo || charaInfo.length <= 0) {
			embed
				.setDescription("We could not find the Character you are looking for");

			context.channel?.sendMessage(embed);
			return;
		}
		if (charaInfo.length === 1) {
			await addCharacterToWishList({
				character: charaInfo[0],
				author,
				channel: context.channel,
				client
			});
			return;
		}
		embed
			.setTitle("Character Wishlist")
			.setDescription(
				"We found multiple Characters that matched your requirement."
			);

		const selectMenuOptions = {
			menuOptions: charaInfo.map((c) => ({
				value: c.name,
				label: titleCase(c.name),
			})),
		} as SelectMenuOptions;
		const selectMenu = await selectionInteraction(
			context.channel,
			options.author.id,
			selectMenuOptions,
			{
				channel: context.channel,
				client,
				author: options.author,
				extras: { cards: charaInfo, },
			},
			handleCharacterSelect
		);

		if (selectMenu) {
			embed.setButtons(selectMenu);
		}

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("commands.rpg.wishlist.add.addToWishlist", err);
		return;
	}
};