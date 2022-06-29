import { GuildItemResponseProps } from "@customTypes/guildItems";
import { GuildMarketProps } from "@customTypes/guildMarkets";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { titleCase } from "title-case";

export function createGuildItemList(
	array: GuildItemResponseProps[],
	currentPage: number,
	perPage: number,
) {
	const fields: EmbedFieldData[] = [];
	array.map((item, i) => {
		fields.push({
			name: `#${i + 1 + (currentPage - 1) * perPage} | ${titleCase(
				item.name
			)} ${emojiMap(item.name)} | quantity: ${item.quantity} | ID: ${
				item.item_id
			}`,
			value: item.description,
		});
	});
	return fields;
}

export function createGuildMarketItemList(
	array: GuildMarketProps[],
	currentPage: number,
	perPage: number,
) {
	const fields: EmbedFieldData[] = [];
	array.map((item, i) => {
		fields.push({
			name: `#${i + 1 + (currentPage - 1) * perPage} | ${titleCase(
				item.name
			)} ${emojiMap(item.name)} | ${numericWithComma(item.price)} ${emoji.gold} | ID: ${
				item.id
			}`,
			value: item.description,
		});
	});
	return fields;
}
