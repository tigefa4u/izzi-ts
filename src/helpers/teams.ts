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
import { clone, reorderObjectKey } from "utility";
import { prepareHPBar } from "./adventure";

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
	const { collections } = params;
	const result = await Promise.all(
		collections
			.map(async (c) => {
				const powerLevel = await getPowerLevelByRank({ rank: c.rank });
				if (!powerLevel) return {} as OverallStatsProps;
				const total = overallStats({
					stats: c.stats,
					character_level: c.character_level,
					powerLevel,
					isForBattle: params.isBattle,
					guildStats: params.guildStats
				});
				c.stats = total;
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
		return {
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
		};
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

	return Promise.all(
		filteredTeams.map(async (team) => {
			const teamMeta = clone(team.metadata);
			const teamMetadata = reorderObjectKey(teamMeta, "position");
			team.metadata = team.metadata.map((meta) => {
				if (teamMetadata[meta.position]?.collection_id) {
					meta = {
						collection_id: null,
						position: meta.position,
					};
				}
				return meta;
			});
			loggers.info(
				"Duplicate collections found in array: " + JSON.stringify(teamMetadata)
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

export const prepareTeamForBattle = async ({
	team,
	user_id,
	id,
}: {
  team: TeamProps;
  user_id: number;
  id: string; // user tag (make sure)
}) => {
	const ids = team.metadata.filter(Boolean).map((m) => Number(m.collection_id));

	const [ collections, guildMember ] = await Promise.all([
		getCollectionById({
			ids,
			user_id,
			user_tag: id,
		}),
		getGuildMember({ user_id }),
	]);
	if (!collections) return;

	let guildStats = undefined as GuildStatProps;
	if (guildMember) {
		const guild = await getGuild({ id: guildMember.guild_id });
		if (guild) {
			guildStats = guild.guild_stats;
		}
	}
	return prepareSkewedCollectionsForBattle({
		collections,
		team,
		id,
		name: `Team ${team.name}`,
		guildStats: guildStats
	});
};

export const prepareSkewedCollectionsForBattle = async ({
	collections,
	team,
	id,
	name = "",
	guildStats
}: PrepareSkewedCollectionsForBattleProps & { guildStats?: GuildStatProps; }) => {
	const totalStats = await prepareTotalOverallStats({
		collections,
		isBattle: true,
		guildStats: guildStats
	});

	const skewed = collections.reduce(
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
		const collectionsMeta = reorderObjectKey(collections, "id");
		// team metadata positions are (1, 2, 3)
		team.metadata.forEach((m) => {
			battleCards[m.position - 1] = collectionsMeta[m.collection_id || 0];
		});
	} else {
		battleCards.push(...collections);
	}
	return {
		totalStats: {
			...totalStats?.totalOverallStats,
			health: prepareHPBar(),
			character_level: skewed.character_level,
			criticalDamage: 1,
			effective: 1,
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
	channel: ChannelProp
) => {
	const team = await getTeamById({
		user_id: user_id,
		id: selected_team_id,
	});
	if (!team) {
		channel?.sendMessage(
			"We were unable to find your Team, please reset your teams!"
		);
		return;
	}
	const playerTeamStats = await prepareTeamForBattle({
		team,
		user_id: user_id,
		id: user_tag,
	});
	if (!playerTeamStats) {
		channel?.sendMessage(
			`We are unable to prepare __Team ${team.name}__. Please reset your team`
		);
		return;
	}
	return {
		stats: playerTeamStats,
		name: team.name,
	};
};
