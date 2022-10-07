import { CollectionReturnType } from "@customTypes/collections";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { titleCase } from "title-case";

export const createCollectionList = (array: CollectionReturnType[]) => {
	const fields: EmbedFieldData[] = [];
	array.map(async (c) => {
		fields.push({
			name: `#${c.row_number} | ${
				c.is_favorite ? emoji.favorite : ""
			} ${titleCase(c.metadata?.nickname || c.name)} | Level ${
				c.character_level
			} ${emojiMap(c.type)} ${emojiMap(c.abilityname)} ${
				c.itemname ? emojiMap(c.itemname) + " " : ""
			}${c.is_on_market ? emoji.shoppingcart : ""} ${
				c.is_on_cooldown ? `${emoji.cooldown} [${c.remainingHours} hours ${c.remainingMinutes} minutes]` : ""
			}`,
			value: `${titleCase(c.rank)} | Souls: ${c.souls}${
				c.reqSouls && c.reqSouls > 0 ? ` / ${c.reqSouls}` : ""
			} | ID: ${c.id}`,
		});
	});
	return fields;
};
