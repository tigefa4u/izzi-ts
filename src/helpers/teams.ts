import { ChannelProp, OverallStatsProps } from "@customTypes";
import { GuildStatProps } from "@customTypes/guilds";
import { BattleStats } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import {
	PrepareSkewedCollectionsForBattleProps,
	PrepareTotalOverallStats,
	TeamProps,
} from "@customTypes/teams";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import { getGuildMember } from "api/controllers/GuildMembersController";
import { getGuild } from "api/controllers/GuildsController";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { getTeamById, updateTeam } from "api/controllers/TeamsController";
import { overallStats } from "helpers";
import loggers from "loggers";
import { clone, isEmptyValue, reorderObjectKey } from "utility";
import { prepareEnergyBar, prepareHPBar } from "./adventure";
import { CharacterStatProps } from "@customTypes/characters";
import { getItemById } from "api/controllers/ItemsController";
import { DEFAULT_DPR } from "./constants";

const prepareItemStats = ({
	itemStats,
	guildItemStats,
}: {
  itemStats: GuildStatProps;
  guildItemStats: GuildStatProps;
}) => {
	if (
		!guildItemStats ||
    isEmptyValue(guildItemStats) ||
    !itemStats ||
    isEmptyValue(itemStats)
	)
		return itemStats;
	const stats = {} as GuildStatProps;
	if (!stats) return itemStats;
	const clonedStats = clone(guildItemStats);
	Object.keys(itemStats).map((stat) => Object.assign(stats, { [stat]: itemStats[stat  as keyof GuildStatProps] }));
	Object.keys(clonedStats).map((stat) => {
		Object.assign(stats, {
			[stat]: Math.ceil(
				(stats[stat as keyof GuildStatProps] || 0) +
          (stats[stat as keyof GuildStatProps] || 1) *
            (guildItemStats[stat as keyof GuildStatProps] / 100)
			),
		});
	});
	if (stats) {
		Object.keys(stats).map((stat) =>
			isNaN(stats[stat as keyof GuildStatProps])
				? 0
				: stats[stat as keyof GuildStatProps]
		);
	}
	return stats;
};

export const prepareTotalOverallStats = async (
	params: PrepareTotalOverallStats
): Promise<
  | {
      totalOverallStats: OverallStatsProps;
      totalPowerLevel: number;
      collections: CollectionCardInfoProps[];
    }
  | undefined
> => {
	const { collections, capCharacterMaxLevel } = params;
	const result = await Promise.all(
		collections
			.map(async (c) => {
				const powerLevel = await getPowerLevelByRank({ rank: c.rank });
				if (!powerLevel) return {} as OverallStatsProps;
				if (capCharacterMaxLevel && c.character_level > powerLevel.max_level) {
					c.character_level = powerLevel.max_level;
				}
				const { totalStats: total, baseStats } = overallStats({
					stats: c.stats,
					character_level: c.character_level,
					powerLevel,
					isForBattle: params.isBattle,
					guildStats: params.guildStats,
				});
				c.stats = baseStats;
				c.itemStats = prepareItemStats({
					itemStats: c.itemStats,
					guildItemStats: params.itemStats,
				}) as CharacterStatProps;
				return total;
			})
			.filter(Boolean)
	);

	const initialStats = {
		vitality: 0,
		defense: 0,
		dexterity: 0,
		intelligence: 0,
		strength: 0,
		evasion: 1,
		accuracy: 1,
		critical: 1,
		precision: 1,
		originalHp: 0,
	};

	const totalOverallStats = result.reduce((acc, r) => {
		const reducedObj = {
			vitality: acc.vitality + r.vitality,
			defense: acc.defense + r.defense,
			dexterity: acc.dexterity + r.dexterity,
			intelligence: acc.intelligence + r.intelligence,
			strength: acc.strength + r.strength,
			originalHp: (acc.originalHp || 0) + (r.originalHp || 0),
			evasion: 1,
			accuracy: 1,
			critical: 1,
			precision: 1,
		} as OverallStatsProps;
		if (acc.vitalityBonus || r.vitalityBonus) {
			reducedObj.vitalityBonus = (acc.vitalityBonus || 0) + (r.vitalityBonus || 0);
		}
		if (acc.defenseBonus || r.defenseBonus) {
			reducedObj.defenseBonus = (acc.defenseBonus || 0) + (r.defenseBonus || 0);
		}

		if (acc.strengthBonus || r.strengthBonus) {
			reducedObj.strengthBonus = (acc.strengthBonus || 0) + (r.strengthBonus || 0);
		}
		if (acc.dexterityBonus || r.dexterityBonus) {
			reducedObj.dexterityBonus = (acc.dexterityBonus || 0) + (r.dexterityBonus || 0);
		}
		if (acc.intelligenceBonus || r.intelligenceBonus) {
			reducedObj.intelligenceBonus = (acc.intelligenceBonus || 0) + (r.intelligenceBonus || 0);
		}
		return reducedObj;
	}, initialStats as OverallStatsProps);

	const totalPowerLevel =
    totalOverallStats.vitality +
    totalOverallStats.defense +
    totalOverallStats.dexterity +
    totalOverallStats.intelligence +
    totalOverallStats.strength;

	return {
		totalOverallStats,
		totalPowerLevel,
		collections,
	};
};

export const findDuplicateCollectionInTeamsAndUpdate = async (
	teams: TeamProps[],
	id: number,
	teamId: number
) => {
	loggers.info("Finding duplicate collections in teams starting()...");
	const filteredTeams = teams.filter((team) => {
		const index = team.metadata.findIndex(
			(m) => (m || {}).collection_id === id
		);

		return index >= 0;
	});
	loggers.info("Finding duplicate collections in teams processed..");
	return Promise.all(
		filteredTeams.map(async (team) => {
			const teamMeta = clone(team.metadata);
			const teamMetadata = reorderObjectKey(teamMeta, "position");
			team.metadata = team.metadata.map((meta) => {
				if (teamMetadata[meta.position]?.collection_id === id) {
					meta = {
						collection_id: null,
						position: meta.position,
					};
				}
				return meta;
			});
			loggers.info(
				"Duplicate collections found in array: ", teamMetadata
			);
			if (Object.keys(teamMetadata).length > 0) {
				if (teamId !== team.id) {
					await updateTeam(
						{
							id: team.id,
							user_id: team.user_id,
						},
						{ metadata: JSON.stringify(team.metadata) }
					);
				}

				return team;
			}
			return;
		})
	)
		.then((res) => res)
		.catch((err) => {
			throw err;
		});
};

export const validateTeam = (team: TeamProps) => {
	const filtered = team.metadata.filter((m) => m.collection_id);
	if (filtered.length <= 0) {
		return false;
	}
	return true;
};

/**
 * Purpose - Prepare Player Team with Guild stats and over all stats
 */
export const prepareTeamForBattle = async ({
	team,
	user_id,
	id,
	canAddGuildStats,
	isDungeon = false,
	capCharacterMaxLevel = false
}: {
  team: TeamProps;
  user_id: number;
  id: string; // user tag (make sure)
  canAddGuildStats: boolean;
  isDungeon?: boolean;
  capCharacterMaxLevel?: boolean;
}) => {
	const ids = team.metadata.filter(Boolean).map((m) => Number(m.collection_id));

	const [ collections, guildMember ] = await Promise.all([
		getCollectionById({
			ids,
			user_id,
			user_tag: id,
			isDungeon
		}),
		getGuildMember({ user_id }),
	]);
	if (!collections || collections.length <= 0) return;

	let guildStats = undefined as GuildStatProps;
	let itemStats = undefined as GuildStatProps;
	if (guildMember && canAddGuildStats) {
		const guild = await getGuild({ id: guildMember.guild_id });
		if (guild) {
			guildStats = guild.guild_stats;
			if (!isEmptyValue(guild.item_stats || {})) {
				itemStats = guild.item_stats;
			}
		}
	}
	return prepareSkewedCollectionsForBattle({
		collections: clone(collections),
		team,
		id,
		name: `Team ${team.name}`,
		guildStats: guildStats,
		itemStats,
		isDungeon,
		capCharacterMaxLevel
	});
};

export const prepareSkewedCollectionsForBattle = async ({
	collections,
	team,
	id,
	name = "",
	guildStats,
	itemStats,
	isDungeon,
	capCharacterMaxLevel = false
}: PrepareSkewedCollectionsForBattleProps & {
  guildStats?: GuildStatProps;
  itemStats?: GuildStatProps;
  isDungeon?: boolean;
  capCharacterMaxLevel?: boolean;
}) => {
	if (team) {
		const tempCollectionsMeta = reorderObjectKey(collections, "id");
		await Promise.all(team.metadata.map(async (m) => {
			const card = tempCollectionsMeta[m.collection_id || 0];
			const idx = collections.findIndex((c) => c.id === m.collection_id);
			if (idx >= 0) {
				collections[idx].name = collections[idx].metadata?.nickname || collections[idx].name;
			}
			if ((card && !card.item_id && m.item_id) || (isDungeon && m.item_id)) {
				if (idx >= 0) {
					const item = await getItemById({ id: m.item_id });
					if (item) {
						const res = collections[idx];
						res.itemStats = item.stats;
						res.item_id = item.id;
						res.itemname = item.name;
						res.itemdescription = item.description;
						collections[idx] = res;
					}
				}
			}
			return collections;
		}));
	}
	const totalStats = await prepareTotalOverallStats({
		collections: clone(collections),
		isBattle: true,
		guildStats: clone(guildStats),
		itemStats: clone(itemStats),
		capCharacterMaxLevel
	});
	if (!totalStats) {
		throw new Error("Unable to calculate total stats");
	}
	const skewed = totalStats.collections.reduce(
		(acc, r) => {
			return {
				...r,
				character_level: acc.character_level + r.character_level,
			};
		},
    { character_level: 0 } as CollectionCardInfoProps
	);
	const battleCards: (CollectionCardInfoProps | undefined)[] = [];

	if (team) {
		const collectionsMeta = reorderObjectKey(totalStats.collections, "id");
		// team metadata positions are (1, 2, 3)
		team.metadata.forEach((m) => {
			const cardToAssign = collectionsMeta[m.collection_id || 0];
			battleCards[m.position - 1] = cardToAssign;
		});
	} else {
		battleCards.push(...totalStats.collections);
	}
	return {
		totalStats: {
			...totalStats?.totalOverallStats,
			health: prepareHPBar(),
			character_level: skewed.character_level,
			criticalDamage: 1,
			effective: 1,
			dpr: clone(DEFAULT_DPR),
			energy: prepareEnergyBar()
		},
		id,
		cards: battleCards,
		name: name,
	} as BattleStats;
};

export const validateAndPrepareTeam = async (
	user_id: number,
	user_tag: string,
	selected_team_id: number,
	channel: ChannelProp,
	canAddGuildStats = true,
	capCharacterMaxLevel = false
) => {
	const team = await getTeamById({
		user_id: user_id,
		id: selected_team_id,
	});
	if (!team) {
		channel?.sendMessage(
			"We were unable to find your Team, please reset your team using ``iz tm reset``!"
		);
		return;
	}
	const playerTeamStats = await prepareTeamForBattle({
		team,
		user_id: user_id,
		id: user_tag,
		canAddGuildStats,
		capCharacterMaxLevel
	});
	if (!playerTeamStats) {
		channel?.sendMessage(
			`We are unable to prepare __Team ${team.name}__. Please reset your team using \`\`iz tm reset\`\`.`
		);
		return;
	}
	return {
		stats: playerTeamStats,
		name: team.name,
	};
};
