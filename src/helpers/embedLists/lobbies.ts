import { OverallStatsProps } from "@customTypes";
import { RaidProps } from "@customTypes/raids";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { MAX_RAID_LOBBY_MEMBERS } from "helpers/constants";
import { statMultiplier } from "helpers/raid";
import { titleCase } from "title-case";
import { clone } from "utility";

export const createLobbiesList = (
	array: RaidProps[],
	currentPage: number,
	perPage: number
) => {
	const fields: EmbedFieldData[] = [];
	array.map((item, i) => {
		const stats = clone(item.stats);
		let pl = stats.battle_stats.stats["strength"];
		const keys = Object.keys(stats.battle_stats.stats);
		keys.forEach((key) => {
			if ([ "vitality", "dexterity", "intelligence", "defense" ].includes(key)) {
				stats.battle_stats.stats[key as keyof OverallStatsProps] = Math.round(
					(stats.battle_stats.stats[key as keyof OverallStatsProps] || 0) *
			  statMultiplier[item.stats.rawDifficulty.toLowerCase()]
				);
	
				pl = pl + (stats.battle_stats.stats[key as keyof OverallStatsProps] || 0);
			}
		});
		fields.push({
			name: `#${i + 1 + (currentPage - 1) * perPage} | ${item.raid_boss
				.map((i) => `${titleCase(i.name)} ${emojiMap(i.abilityname)}`)
				.join(", ")} [${titleCase(item.stats.difficulty)}]`,
			value: `Level ${numericWithComma(item.stats.battle_stats.boss_level)} | ` +
            `Power Level: ${numericWithComma(pl)}` +
            `${item.loot.drop.event?.shard ? `| ${item.loot.drop.event?.shard} ${emoji.shard}` : ""} ` +
            `| ID: ${item.id} **[${Object.keys(item.lobby).length} / ${MAX_RAID_LOBBY_MEMBERS}]**`,
		});
	});

	return fields;
};
