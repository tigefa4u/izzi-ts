import { ItemProps } from "@customTypes/items";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { titleCase } from "title-case";

export const createItemList = (
	array: ItemProps[],
	currentPage: number,
	perPage: number,
	options?: { isMarket: boolean }
): EmbedFieldData[] => {
	const fields: EmbedFieldData[] = [];
	array.map((item, i) => {
		fields.push({
			name: `#${i + 1 + (currentPage - 1) * perPage} ${titleCase(item.name)} ${emojiMap(
				item.name
			)}${options?.isMarket ? `| ${item.price} ${emoji.gold}` : ""}`,
			value: `Category: [${item.category
				.map((i) => titleCase(i))
				.join(", ")}] | ID: ${item.id}`,
		});
	});

	return fields;
};
