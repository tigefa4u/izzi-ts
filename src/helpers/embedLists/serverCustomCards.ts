import { CustomServerCardAndCharacterProps } from "@customTypes/guildEvents/customServerCards";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import { titleCase } from "title-case";

export const createServerCustomCardList = (
	array: CustomServerCardAndCharacterProps[],
	currentPage: number,
	perPage: number
) => {
	const fields: EmbedFieldData[] = [];
	array.map(async (c, i) => {
		fields.push({
			name: `#${i + 1 + (currentPage - 1) * perPage} ${titleCase(
				c.name
			)} ${emojiMap(c.type)} ${emojiMap(c.abilityname)}`,
			value: `**ATK:** ${c.stats.vitality}, **HP:** ${c.stats.strength}, ` +
            `**DEF:** ${c.stats.defense}, **SPD:** ${c.stats.dexterity}, **ARM:** ${c.stats.intelligence}`,
		});
	});
	return fields;
};
