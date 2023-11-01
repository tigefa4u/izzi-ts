import { CharacterDetailsProps } from "@customTypes/characters";
import { BaseProps } from "@customTypes/command";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { DZ_CARD_COST } from "helpers/constants/darkZone";
import loggers from "loggers";
import { titleCase } from "title-case";
import { dex } from "../../xendex";

export const darkZoneDex = async ({
	context,
	client,
	options,
	args,
}: BaseProps) => {
	try {
		args.push("-dz");
		dex({
			client,
			context,
			args,
			options,
		});
		return;
	} catch (err) {
		loggers.error("information.dex.darkZoneDex: ERROR", err);
		return;
	}
};

export const darkZoneDexEmbedList = (
	array: CharacterDetailsProps[],
	currentPage: number,
	perPage: number
) => {
	const fields: EmbedFieldData[] = [];
	if (!array) return fields;
	array.map((item, i) => {
		fields.push({
			name: `#${i + 1 + (currentPage - 1) * perPage} ${titleCase(
				item.name
			)} ${emojiMap(item.type)} ${emojiMap(
				item.abilityname
			)} | Use \`iz dz buy ${item.id}\``,
			value: `${[ "ATK", "HP", "DEF", "SPD", "ARM" ]
				.map((s) => `**${s}:** 70`)
				.join(", ")} | ${numericWithComma(DZ_CARD_COST)} ${emoji.gold}`,
		});
	});

	return fields;
};
