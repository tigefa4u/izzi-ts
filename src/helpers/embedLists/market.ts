import { IMarketProps } from "@customTypes/market";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { titleCase } from "title-case";

export const createMarketList = (array: IMarketProps[]) => {
	const fields: EmbedFieldData[] = [];
	array.map((item) => {
		fields.push({
			name: `${item.price} ${emoji.gold} | ${titleCase(item.name)} Level ${
				item.character_level
			} ${emojiMap(item.type)} ${emojiMap(item.abilityname)}`,
			value: `${titleCase(item.rank)} | Souls ${item.souls} | ID: ${
				item.collection_id
			}`,
		});
	});
	return fields;
};
