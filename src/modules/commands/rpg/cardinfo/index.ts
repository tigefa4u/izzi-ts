import { titleCase } from "title-case";
import { BaseProps } from "@customTypes/command";
import { getCharacterInfo } from "api/controllers/CharactersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import { createSingleCanvas } from "helpers/canvas";
import loggers from "loggers";
import { prepareStatsDesc } from "helpers";
import { getFloorsByCharacterId } from "api/controllers/StagesController";
import { MessageEmbed } from "discord.js";
import { NormalizeFloorProps } from "@customTypes/stages";
import { CharacterCardProps } from "@customTypes/characters";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";
import { AuthorProps, ChannelProp } from "@customTypes";
import { selectionInteraction } from "utility/SelectMenuInteractions";
import { SelectMenuCallbackParams, SelectMenuOptions } from "@customTypes/selectMenu";
import { groupByKey } from "utility";

async function prepareCinfoDetails(
	embed: MessageEmbed,
	characterInfo: CharacterCardProps,
	location?: NormalizeFloorProps,
) {
	const elementTypeEmoji = emojiMap(characterInfo?.type);
	const cardCanvas = await createSingleCanvas(characterInfo, true);
	if (!cardCanvas) throw "Unable to create canvas";
	const attachment = createAttachment(
		cardCanvas.createJPEGStream(),
		"cinfo.jpg"
	);
	const statsPrep = {
		...characterInfo.stats,
		abilityname: characterInfo.abilityname,
		abilitydescription: characterInfo.abilitydescription,
		is_passive: characterInfo.is_passive
	};
	embed
		.setTitle(titleCase(characterInfo.name))
		.setDescription(
			`**Series:** ${titleCase(characterInfo.series)}\n**Card Copies:** ${
				characterInfo.copies
			}\n**Element Type:** ${titleCase(characterInfo.type)} ${
				elementTypeEmoji ? elementTypeEmoji : ""
			}\n**Zone:** ${
				location?.zone
					? location.zone
					: characterInfo.series.includes("event")
						? "Event"
						: "None"
			}\n**Floors:** ${
				location?.floors && location.floors.length > 0
					? location.floors.map((i) => i).join(", ")
					: characterInfo.series.includes("event")
						? "Event"
						: "None"
			}\n**RANK:** Silver\n${prepareStatsDesc(statsPrep)}`
		)
		.setImage("attachment://cinfo.jpg")
		.attachFiles([ attachment ]);
    
	return embed;
}

export const cinfo = async ({ context, client, args, options }: BaseProps) => {
	try {
		const charaInfo = await getCharacterInfo({ name: args.join(" ") });
		const embed = createEmbed(options.author, client);
		if (!charaInfo || charaInfo.length <= 0) {
			embed
				.setTitle(DEFAULT_ERROR_TITLE)
				.setDescription("We could not find the Character you are looking for");

			context.channel?.sendMessage(embed);
			return;
		}
		const abandonCardIndex = charaInfo.findIndex((c) => c.name === "luna");
		if (abandonCardIndex >= 0) {
			charaInfo.splice(abandonCardIndex, 1);
		}
		if (charaInfo.length === 1) {
			await showCharacterDetails(options.author, charaInfo[0], context.channel);
			return;
		}
		embed.setTitle("Character Info")
			.setDescription("We found multiple Characters that matched your requirement.");
	
		const selectMenuOptions = {
			menuOptions: charaInfo.map((c) => ({
				value: c.name,
				label: titleCase(c.name)
			}))
		} as SelectMenuOptions;
		const selectMenu = await selectionInteraction(
			context.channel,
			options.author.id,
			selectMenuOptions,
			{
				channel: context.channel,
				client,
				author: options.author,
				extras: { cards: charaInfo }
			},
			handleCharacterSelect
		);

		if (selectMenu) {
			embed.setButtons(selectMenu);
		}

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.cardinfo.cinfo(): something went wrong",
			err
		);
		return;
	}
};

async function handleCharacterSelect(
	options: SelectMenuCallbackParams<{ cards: CharacterCardProps[] }>,
	value: string
) {
	if (!options.extras?.cards) return;
	const cardsMeta = groupByKey(options.extras.cards, "name");
	const character = cardsMeta[value][0];
	showCharacterDetails(options.author, character, options.channel);
	return;
}

async function showCharacterDetails(author: AuthorProps, character: CharacterCardProps, channel: ChannelProp) {
	let embed = createEmbed(author);
	const location = await getFloorsByCharacterId({ character_id: character.id, });
	embed = await prepareCinfoDetails(
		embed,
		character,
		location,
	);
	channel?.sendMessage(embed);
	return;
}