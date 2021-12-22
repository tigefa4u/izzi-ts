import { titleCase } from "title-case";
import { BaseProps } from "@customTypes/command";
import { getCharacterInfo } from "api/controllers/CharactersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import { createSingleCanvas } from "helpers/canvas";
import loggers from "loggers";
import { prepareAbilityDescription } from "helpers";
import { getFloorsByCharacterId } from "api/controllers/StagesController";
import { Client, MessageEmbed } from "discord.js";
import { NormalizeFloorProps } from "@customTypes/stages";
import { CharacterCardProps } from "@customTypes/characters";

async function prepareCinfoDetails(
	client: Client,
	embed: MessageEmbed,
	characterInfo: CharacterCardProps,
	location?: NormalizeFloorProps,
	options?: BaseProps["options"],
) {
	const author = options?.author;
	const abilityEmoji = emojiMap(characterInfo?.abilityname);
	const elementTypeEmoji = emojiMap(characterInfo?.type);
	const cardCanvas = await createSingleCanvas(characterInfo, true);
	if (!cardCanvas) throw "Unable to create canvas";
	const attachment = createAttachment(
		cardCanvas.createJPEGStream(),
		"cinfo.jpg"
	);
	embed
		.setAuthor(author?.username || "", author?.displayAvatarURL())
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
			}\n**RANK:** Silver\n**ATK:** ${characterInfo.stats.vitality}\n**HP:** ${
				characterInfo.stats.strength
			}\n**DEF:** ${characterInfo.stats.defense}\n**SPD:** ${
				characterInfo.stats.dexterity
			}\n**INT:** ${characterInfo.stats.intelligence}\n\n**Ability**\n${
				abilityEmoji ? abilityEmoji : ""
			} **${titleCase(characterInfo.abilityname)} ${
				characterInfo.is_passive ? "[PSV]" : ""
			}:** ${prepareAbilityDescription(characterInfo.abilitydescription)}`
		)
		.setImage("attachment://cinfo.jpg")
		.attachFiles([ attachment ])
		.setThumbnail(client.user?.displayAvatarURL() || "");
    
	return embed;
}

export const cinfo = async ({ message, client, args, options }: BaseProps) => {
	try {
		const author = options?.author || message.author;
		console.time("chara");
		const characterInfo = await getCharacterInfo({ name: args.join(" ") });
		console.timeEnd("chara");
		let embed = createEmbed(message.member);
		if (!characterInfo) {
			embed
				.setTitle("Error :no_entry:")
				.setDescription("We could not find the Character you are looking for");

			message.channel.sendMessage(embed);
			return;
		}
		console.time("location");
		const location = await getFloorsByCharacterId({ character_id: characterInfo.id, });
		console.timeEnd("location");
		console.time("embed-data");
		embed = await prepareCinfoDetails(
			client,
			embed,
			characterInfo,
			location,
			{ author }
		);
		console.timeEnd("embed-data");
		message.channel.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.cardinfo.cinfo: something went wrong",
			err
		);
		return;
	}
};
