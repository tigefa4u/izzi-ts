import { RaidProps } from "@customTypes/raids";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { MAX_RAID_LOBBY_MEMBERS } from "helpers/constants/constants";
import { titleCase } from "title-case";

export const createLobbiesList = (
	array: RaidProps[],
	currentPage: number,
	perPage: number
) => {
	const fields: EmbedFieldData[] = [];
	array.map((item, i) => {
		fields.push({
			name: `#${i + 1 + (currentPage - 1) * perPage} | ${item.raid_boss
				.map((i) => `${titleCase(i.name)} ${emojiMap(i.abilityname)}`)
				.join(", ")} [${titleCase(item.stats.difficulty)}]${item.is_dark_zone ? " **[Dark Zone]**" : ""}`,
			value: `Level ${numericWithComma(item.stats.battle_stats.boss_level)} | ` +
            `Power Level: ${numericWithComma(item.stats.battle_stats.power_level)}` +
            `${item.loot.drop.event?.shard ? `| ${item.loot.drop.event?.shard} ${emoji.shard}` : ""} ` +
            `| ID: ${item.id} **[${Object.keys(item.lobby).length} / ${MAX_RAID_LOBBY_MEMBERS}]**`,
		});
	});

	return fields;
};
