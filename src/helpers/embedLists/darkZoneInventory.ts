import { CharacterStatProps } from "@customTypes/characters";
import { DzInventoryReturnType } from "@customTypes/darkZone/inventory";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { statNames } from "helpers/constants/darkZone";
import { titleCase } from "title-case";

export const createDarkZoneEmbedList = (array: DzInventoryReturnType[]) => {
	const fields: EmbedFieldData[] = [];
	array.map((c) => {
		fields.push({
			name: `#${c.row_number} | ${
				c.is_favorite ? emoji.favorite : ""
			} ${titleCase(
				c.metadata?.nickname || c.name
			)} | Level ${c.character_level} ${emojiMap(c.type)} ${emojiMap(
				c.abilityname
			)}${c.is_on_market ? " :shopping_cart:" : ""} | ID: ${c.id}`,
			value: `${titleCase(c.rank)} | ${statNames
				.map((s) => `**${s.name}:** ${c.stats[s.key as keyof CharacterStatProps]}`)
				.join(", ")}`,
		});
	});
	return fields;
};
