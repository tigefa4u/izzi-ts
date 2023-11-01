import { CharacterStatProps } from "@customTypes/characters";
import { IMarketProps } from "@customTypes/market";
import { IDzMarketProps } from "@customTypes/market/darkZone";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { statNames } from "helpers/constants/darkZone";
import { titleCase } from "title-case";

export const createMarketList = (array: IMarketProps[]) => {
	const fields: EmbedFieldData[] = [];
	array.map((item) => {
		fields.push({
			name: `${numericWithComma(item.price)} ${emoji.gold} | ${titleCase(
				item.name
			)} Level ${item.character_level} ${emojiMap(item.type)} ${emojiMap(
				item.abilityname
			)}`,
			value: `${titleCase(item.rank)} | Souls ${item.souls} | ID: ${
				item.collection_id
			}`,
		});
	});
	return fields;
};

export const createDzMarketList = (array: IDzMarketProps[]) => {
	const fields: EmbedFieldData[] = [];
	array.map((item) => {
		fields.push({
			name: `${numericWithComma(item.price)} ${emoji.gold} | ${titleCase(
				item.rank
			)} | ${titleCase(item.name)} Level ${item.character_level} ${emojiMap(
				item.type
			)} ${emojiMap(item.abilityname)}`,
			value: `${statNames
				.map((s) => `**${s.name}:** ${item.stats[s.key as keyof CharacterStatProps]}`)
				.join(", ")} | ID: ${item.collection_id}`,
		});
	});
	return fields;
};
