import { BaseProps } from "@customTypes/command";
import { WorldBossBattleProps } from "@customTypes/raids/worldBoss";
import { getWorldBossBattleLb, getWorldBossRaid } from "api/controllers/WorldBossController";
import { createEmbed } from "commons/embeds";
import { EmbedFieldData } from "discord.js";
import { numericWithComma } from "helpers";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";
import loggers from "loggers";

const _prepareFields = (array: WorldBossBattleProps[]) => {
	const fields: EmbedFieldData[] = [];
	array.map((item, i) => {
		fields.push({
			name: `#${i + 1} | ${item.username} (${item.user_tag})`,
			value: `Damage Dealt: __${numericWithComma(item.damage_dealt)}__`
		});
	});
	return fields;
};

export const viewWorldBossLB = async ({ client, context, options }: BaseProps) => {
	try {
		const { author } = options;
		const raid = await getWorldBossRaid({ is_start: true });

		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!raid) {
			embed.setDescription(
				`Summoner **${author.username}**, There are currently no World Boss Challenges. Check back later.`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const result = await fetchWorldBossLeaderboardFields(new Date(raid.created_at || ""));

		embed
			.setTitle("World Boss Battle Leaderboard")
			.setDescription("Top 10 Damage dealt by Global Izzi players are shown below.")
			.setFooter({
				text: `page 1 / 1 | Summoner ID: ${author.id}`,
				iconURL: author.displayAvatarURL()
			});

		if (result?.fields) {
			embed.setFields(result.fields);
		}

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("rpg.worldBoss.leaderboard.viewWorldBossLB: ERROR", err);
		return;
	}
};

export const fetchWorldBossLeaderboardFields = async (fromDate: Date) => {
	const result = await getWorldBossBattleLb({ fromDate: fromDate });
	if (!result) return;
	const fields = _prepareFields(result);

	return {
		fields,
		rawResult: result 
	};
};