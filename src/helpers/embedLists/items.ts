import { ItemProps } from "@customTypes/items";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
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
			)}${options?.isMarket ? ` | ${numericWithComma(item.price)} ${emoji.gold}` : ""}`,
			value: `Equip this item using \`\`equip <#id> ${item.id}\`\` | ID: ${item.id}`,
		});
	});

	return fields;
};
