import { BaseProps } from "@customTypes/command";
import { WorldBossBattleProps } from "@customTypes/raids/worldBoss";
import { getWorldBossBattles, getWorldBossRaid } from "api/controllers/WorldBossController";
import { createEmbed } from "commons/embeds";
import { EmbedFieldData } from "discord.js";
import emoji from "emojis/emoji";
import { getRemainingTimer, numericWithComma } from "helpers";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";
import loggers from "loggers";
import { getTTL } from "modules/cooldowns/channels";

const _prepareFields = (array: WorldBossBattleProps[]) => {
	const fields: EmbedFieldData[] = [];
	array.map((item, i) => {
		const gold = item.loot.gold as number || 0;
		fields.push({
			name: `#${i + 1} | Damage Dealt: __${numericWithComma(item.damage_dealt)}__ | ` +
            `Total Gold Looted: __${numericWithComma(gold)}__ ${emoji.gold}`,
			value: `Last Attack: ${getRemainingTimer(new Date(item.created_at).getTime())}`
		});
	});
	return fields;
};

export const viewWorldBossPlayerLogs = async ({ client, context, options }: BaseProps) => {
	try {
		const { author } = options;
		const raid = await getWorldBossRaid({ is_start: true });

		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!raid) {
			embed.setDescription(
				`Summoner **${author.username}**, the World Boss Challenge either does not exist or has not started. ` +
                "Check back later to view your recent attack logs."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const [ logs, ttl ] = await Promise.all([
			getWorldBossBattles({
				user_tag: author.id,
				fromDate: raid.created_at ? new Date(raid.created_at) : new Date()
			}, {
				currentPage: 1,
				perPage: 5
			}),
			getTTL(author.id, "worldboss-attack")
		]);
		let ttlDesc = "";

		if (ttl) {
			const dt = new Date();
			const ttls = dt.setSeconds(dt.getSeconds() + ttl);
			ttlDesc = `\n**Next Attack: ${getRemainingTimer(ttls)}**`;
		}
		embed.setTitle("World Boss Attack Logs")
			.setDescription("Your latest 5 Attack logs are shown below." + ttlDesc)
			.setFooter({
				text: `page 1 / 1 | Summoner ID: ${author.id}`,
				iconURL: author.displayAvatarURL()
			});

		if (logs?.data) {
			embed.setFields(_prepareFields(logs.data));
		}
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("rpg.worldBoss.logs.viewWorldBossPlayerLogs: ERROR", err);
		return;
	}
};