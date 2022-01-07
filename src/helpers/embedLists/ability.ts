import { AbilityProps } from "@customTypes/abilities";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import { prepareAbilityDescription } from "helpers";
import { titleCase } from "title-case";

export const createAbilityList = (array: AbilityProps[], currentPage: number, perPage: number): EmbedFieldData[] => {
	const fields: EmbedFieldData[] = [];
	array.map((item, i) => {
		fields.push({
			name: `#${i + 1 + (currentPage - 1) * perPage} ${titleCase(item.name)} ${
				item.is_passive ? "[PSV]" : ""
			} ${emojiMap(item.name)}`,
			value: prepareAbilityDescription(item.description),
		});
	});
	return fields;
};