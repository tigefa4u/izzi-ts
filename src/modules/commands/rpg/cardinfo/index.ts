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
		const characterInfo = await getCharacterInfo({ name: args.join(" ") });
		let embed = createEmbed(options.author, client);
		if (!characterInfo) {
			embed
				.setTitle(DEFAULT_ERROR_TITLE)
				.setDescription("We could not find the Character you are looking for");

			context.channel?.sendMessage(embed);
			return;
		}
		const location = await getFloorsByCharacterId({ character_id: characterInfo.id, });
		embed = await prepareCinfoDetails(
			embed,
			characterInfo,
			location,
		);
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
