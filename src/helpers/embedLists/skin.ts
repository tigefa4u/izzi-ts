import { ISkinCollection } from "@customTypes/skins";
import { EmbedFieldData } from "discord.js";
import { titleCase } from "title-case";

export const createSkinList = (
	array: Omit<ISkinCollection, "metadata">[],
	currentPage: number,
	perPage: number
) => {
	const fields: EmbedFieldData[] = [];
	array.map((skin, i) => {
		fields.push({
			name: `\`\`#${i + 1 + (currentPage - 1) * perPage}\`\` ${titleCase(
				skin.name
			)} | ID: ${skin.id}`,
			value: `Choose this skin by typing \`\`skin choose ${skin.id}\`\``,
		});
	});

	return fields;
};
