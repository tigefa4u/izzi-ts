import { CrateProps } from "@customTypes/crates";
import { EmbedFieldData } from "discord.js";
import emoji from "emojis/emoji";
import { titleCase } from "title-case";
import { XPGainPerRankProps } from "@customTypes";

export const createCrateList = (array: CrateProps[], currentPage: number, perPage: number) => {
	const fields: EmbedFieldData[] = [];
	array.map((item, i) => {
		const contents = item.contents;
		const num = contents.numberOfCards;
		fields.push({
			name: `#${i + 1 + (currentPage - 1) * perPage}| ${titleCase(
				item.category
			)} Crate ${emoji.crate} | ID: ${item.id}`,
			value: `Contains\n**${`Cards ${num}x [${Object.keys(contents.cards)
				.map((item) => {
					return `${contents.cards[item as keyof XPGainPerRankProps]}% ${titleCase(item)}`;
				})
				.join("/ ")}]`}**\n${
				contents.orbs ? `**Orbs: ${contents.orbs} ${emoji.blueorb}**` : ""
			}`,
		});
	});
	return fields;
};