import { AuthorProps } from "@customTypes";
import {
	CharacterDetailsProps,
	CharacterStatProps,
} from "@customTypes/characters";
import { createEmbed } from "commons/embeds";
import { Client, EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import { titleCase } from "title-case";

export const createDexList = (
	array: CharacterDetailsProps[],
	currentPage: number,
	perPage: number
) => {
	const fields: EmbedFieldData[] = [];
	if (!array) return fields;
	array.map((item, i) => {
		fields.push({
			name: `#${i + 1 + (currentPage - 1) * perPage} ${titleCase(
				item.name
			)} ${emojiMap(item.type)} ${emojiMap(item.abilityname)}`,
			value: Object.keys(item.stats)
				.map((stat, j) => {
					if (![ "critical", "accuracy", "evasion" ].includes(stat)) {
						return `**${
							stat === "vitality"
								? "ATK"
								: stat === "strength"
									? "HP"
									: stat === "dexterity"
										? "SPD"
										: stat === "intelligence" ? "ARM" : stat.slice(0, 3).toUpperCase()
						}**: ${item.stats[stat as keyof CharacterStatProps]}${
							j < 4 ? "," : ""
						}`;
					}
				})
				.join(" "),
		});
	});
	return fields;
};
