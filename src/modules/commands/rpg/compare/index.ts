import {
	CharacterDetailsProps,
	CharacterStatProps,
} from "@customTypes/characters";
import { BaseProps } from "@customTypes/command";
import { getCharacters } from "api/controllers/CharactersController";
import { createEmbed } from "commons/embeds";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import { statRelationMap } from "helpers/ability";
import { DEFAULT_ERROR_TITLE, STAR } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";

const getMaxStat = (array: CharacterDetailsProps[], key = "strength") => {
	const k = key as keyof CharacterStatProps;
	return array.reduce((acc, r) => {
		if (!acc?.stats) return acc;
		return acc.stats[k] > r.stats[k]
			? acc
			: acc.stats[k] === r.stats[k] ? {} as CharacterDetailsProps : r;
	});
};

function createCharacterStatList(array: CharacterDetailsProps[]) {
	const fields: EmbedFieldData[] = [];
	const maxStatObj = {} as any;
	[ "strength", "dexterity", "vitality", "defense", "intelligence" ].forEach(
		(stat) => {
			const obj = getMaxStat(array, stat);
			if (obj?.id) {
				maxStatObj[obj.id] = {
					...maxStatObj[obj.id],
					[stat]: `${obj.stats[stat as keyof CharacterStatProps]} ${STAR}`, 
				};
			}
		}
	);
	array.map((character) => {
		fields.push({
			name: `${titleCase(character.name)}`,
			value: `**Element Type:** ${emojiMap(character.type)}\n${Object.keys(
				character.stats
			)
				.map((stat) =>
					[ "evasion", "accuracy", "critical" ].includes(stat)
						? ""
						: `**${statRelationMap[stat as keyof CharacterStatProps]}:** ${
							// character.stats[stat as keyof CharacterStatProps]
							(maxStatObj[character.id] || {})[stat]
								? maxStatObj[character.id][stat]
								: character.stats[stat as keyof CharacterStatProps]
						}`
				)
				.join("\n")}`,
			inline: true,
		});
	});

	return fields;
}

export const compareCards = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const embed = createEmbed(author, client);
		embed.setTitle(DEFAULT_ERROR_TITLE);

		const charaArgs = args.join(" ");
		if (!args) {
			return;
		}
		let charanames = charaArgs.split(",").map((e) => `^${e.trim()}`);
		if (charanames.length > 3) {
			charanames = charanames.slice(0, 3);
			// embed.setDescription("You cannot compare more than 3 Cards");
			// context.channel?.sendMessage(embed);
			// return;
		}
		const characters = await getCharacters({ name: charanames });
		if (characters.length > 0) {
			const list = createCharacterStatList(characters);
			embed.setTitle("Base Stats").addFields(list)
				.setFooter({
					text: `${STAR} = Highest value for stat`,
					iconURL: author.displayAvatarURL()
				})
				.setHideConsoleButtons(true);

			context.channel?.sendMessage(embed);
			return;
		}
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.compare.compare: ERROR",
			err
		);
		return;
	}
};
