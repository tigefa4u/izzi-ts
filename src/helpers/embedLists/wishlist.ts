import { WishlistProps } from "@customTypes/wishlist";
import { EmbedFieldData } from "discord.js";
import { titleCase } from "title-case";

export const createWishlistEmbedList = (
	array: WishlistProps[],
	currentPage: number,
	perPage: number
) => {
	const fields: EmbedFieldData[] = [];
	array.map((item, i) => {
		fields.push({
			name: `\`\`#${i + 1 + (currentPage - 1) * perPage}\`\` ${titleCase(
				item.name || ""
			)} | ID: ${item.id}`,
			value: item.is_skin ? `${titleCase(item.metadata.name || "")}` : "",
		});
	});

	return fields;
};
