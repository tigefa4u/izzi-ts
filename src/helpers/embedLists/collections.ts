import { CollectionReturnType } from "@customTypes/collections";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { FODDER_RANKS } from "helpers/constants";
import { titleCase } from "title-case";

const renderSoulsOrCardCount = (card: CollectionReturnType) => {
	if (FODDER_RANKS.includes(card.rank)) {
		return `Fodders: ${card.card_count || 1}`;
	}
	return `Souls: ${card.souls}${
		card.reqSouls && card.reqSouls > 0 ? ` / ${card.reqSouls}` : ""
	}`;
};

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
			}${c.is_tradable ? "" : " (Non Tradable/Sellable)"}`,
			value: `${titleCase(c.rank)} | ${renderSoulsOrCardCount(c)} | \`iz info ${c.row_number}\` | ID: ${c.id}`,
		});
	});
	return fields;
};
