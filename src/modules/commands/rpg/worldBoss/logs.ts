import { BaseProps } from "@customTypes/command";
import { WorldBossBattleProps } from "@customTypes/raids/worldBoss";
import { getWorldBossBattles, getWorldBossRaid } from "api/controllers/WorldBossController";
import { fetchTotalDamageDealt } from "api/models/WorldBossBattles";
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
		const fromDate = raid.created_at ? new Date(raid.created_at) : new Date();
		const [ logs, ttl, { sum } ] = await Promise.all([
			getWorldBossBattles({
				user_tag: author.id,
				fromDate
			}, {
				currentPage: 1,
				perPage: 5
			}),
			getTTL(author.id, "worldboss-attack"),
			fetchTotalDamageDealt({
				user_tag: author.id,
				fromDate 
			})
		]);
		const totalDamage = Number(sum || 0);
		const originalHp = raid.stats.original_strength;
		const threshold = Math.floor((totalDamage / originalHp) * 100);

		const fivePercentThresDmg = {
			name: "Total damage required for __2.5%__ Threshold",
			num: Math.floor(originalHp * .25)
		};
		const fifteenPercentThresDmg = {
			name: "Total damage required for __10%__ Threshold",
			num: Math.floor(originalHp * .10)
		};
		const twentyFivePercentThresDmg = {
			name: "Total damage required for __18%__ Threshold",
			num: Math.floor(originalHp * .18)
		};
		let ttlDesc = "";
		if (ttl > 0) {
			const dt = new Date();
			const ttls = dt.setSeconds(dt.getSeconds() + ttl);
			ttlDesc = `\n**Next Attack: ${getRemainingTimer(ttls)}**`;
		}
		embed.setTitle("World Boss Attack Logs")
			.setDescription("Your latest 5 Attack logs are shown below." + 
            `\n**Total Damage Dealt:** __${numericWithComma(totalDamage)}__` +
            `\n**Damage Threshold:** __${threshold}%__` +
            `\n${[ fivePercentThresDmg, fifteenPercentThresDmg, twentyFivePercentThresDmg ].map(({ num, name }) => {
            	return `**${name}:** __${numericWithComma(num)}__`;
            }).join("\n")}` + ttlDesc)
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