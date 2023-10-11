import { CharacterStatProps } from "@customTypes/characters";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { createRaid } from "api/controllers/RaidsController";
import {
	getWorldBossRaid,
	getWorldBossToSpawn,
} from "api/controllers/WorldBossController";
import emoji from "emojis/emoji";
import { OWNER_DISCORDID } from "environment";
import { randomElementFromArray } from "helpers";
import {
	WORLD_BOSS_DIFFICULTY,
	WORLD_BOSS_ENERGY,
	WORLD_BOSS_EXPIRES_IN_DAYS,
	WORLD_BOSS_HP_MULTIPLIER,
	WORLD_BOSS_LEVEL,
} from "helpers/constants/constants";
// import { PublishMessageToAllGuilds } from "helpers/directMessages";
import loggers from "loggers";
import { titleCase } from "title-case";
import { computeRaidBossStats } from "../../raids/actions/spawn";
import { computeRank } from "../../raids/computeBoss";
import { prepareWorldBossDesc } from "../../worldBoss/view";

export const spawnWorldBoss = async ({
	options,
	context,
	client,
}: BaseProps) => {
	try {
		const { author } = options;
		if (author.id !== OWNER_DISCORDID) {
			return;
		}
		const raidExists = await getWorldBossRaid();
		if (raidExists) {
			context.channel?.sendMessage(
				"A World boss has already been spawned! " +
          `Has Started: [${raidExists.is_start ? "Yes" : "No"}]`
			);
			return;
		}
		const computedBoss = computeRank(WORLD_BOSS_DIFFICULTY, false, true);
		if (!computedBoss) {
			context.channel?.sendMessage("Unable to spawn world boss");
			loggers.error(
				"spawnWorldBoss: ERROR: Unable to compute world boss loot & difficulty",
				{}
			);
			return;
		}
		const cards = await getWorldBossToSpawn({ rank: randomElementFromArray(computedBoss.rank), });
		if (!cards || cards.length <= 0) {
			loggers.error(
				"spawnWorldBoss: ERROR: Unable to fetch world boss card. Is there a world boss card?",
				{}
			);
			context.channel?.sendMessage("Unable to spawn world boss");
			return;
		}
		const card = cards[0];
		const raidBoss = {
			...card,
			character_level: WORLD_BOSS_LEVEL,
			is_item: false,
			is_on_market: false,
			is_tradable: false,
			user_id: 0,
			item_id: 0,
			r_exp: 0,
			exp: 0,
			is_on_cooldown: false,
			souls: 1,
			rank_id: 0,
		} as CollectionCardInfoProps;

		loggers.info(
			"worldBoss.spawn.spawnWorldBoss: Preparing boss stats for worldboss - ",
			raidBoss
		);

		/**
		 * After the new patch the stats are not that high, need the world boss to be high PL
		 */
		[ "vitality", "defense", "dexterity", "intelligence", "strength" ].map((s) => {
			const k = s as keyof CharacterStatProps;
			if (raidBoss.stats) {
				raidBoss.stats[k] = (raidBoss.stats[k] || 0) * 3;
			}
		});

		const { raidStats, computedLoot } = await computeRaidBossStats({
			raidBosses: [ raidBoss ],
			computedBoss,
		});

		raidStats.battle_stats.energy = WORLD_BOSS_ENERGY;
		raidStats.original_strength =
      raidStats.original_strength * WORLD_BOSS_HP_MULTIPLIER;
		raidStats.remaining_strength = raidStats.original_strength;

		const dt = new Date();
		raidStats.timestamp = dt.setDate(dt.getDate() + WORLD_BOSS_EXPIRES_IN_DAYS);

		const raid = await createRaid({
			stats: raidStats,
			raid_boss: JSON.stringify([ raidBoss ]),
			lobby: {},
			loot: computedLoot,
			is_private: false,
			is_start: false,
			is_world_boss: true,
			is_event: false,
			filter_data: `${raidBoss.name}, ${raidBoss.type}, ${raidBoss.rank}, ${raidStats.difficulty.toLowerCase()}`
		});
		if (!raid) {
			context.channel?.sendMessage("Could not spawn World Boss!");
			return;
		}
		loggers.info("Created world boss with data - ", raid);

		context.channel?.sendMessage(
			`**Level ${WORLD_BOSS_LEVEL}** __${titleCase(card.rank)}__ **${titleCase(
				card.name
			)}** World Boss has been spawned ${emoji.celebration}.\nDM-ing all Guilds`
		);

		const embed = await prepareWorldBossDesc({
			client,
			author,
			currentRaid: raid,
		});

		embed.setDescription(
			"**Hello Summoners! A World Boss Challenge has been spawned. " +
			`Participate and Attack the World Boss to loot Exciting Rewards.**\n\n${embed.description}`
		).setHideConsoleButtons(true);
		// PublishMessageToAllGuilds({
		// 	client,
		// 	content: embed,
		// });
		return;
	} catch (err) {
		loggers.error("specialCommands.worldboss.spawn.spawnWorldBoss: ERROR", err);
		return;
	}
};
