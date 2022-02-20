import { OverallStatsProps } from "@customTypes";
import { BattleStats } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { PrepareTotalOverallStats, TeamMeta, TeamProps } from "@customTypes/teams";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { updateTeam } from "api/controllers/TeamsController";
import { overallStats } from "helpers";
import loggers from "loggers";
import { clone, groupByKey } from "utility";
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
					isForBattle: params.isBattle
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
		originalHp: 0
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
		const index = team.metadata.findIndex((m) => (m || {}).collection_id === id);

		return index >= 0;
	});

	return Promise.all(
		filteredTeams.map(async (team) => {
			const teamMeta = clone(team.metadata);
			const teamMetadata = groupByKey(teamMeta, "position");
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
	).then((res) => res)
		.catch(err => {
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
	const ids = team.metadata
		.filter(Boolean)
		.map((m) => Number(m.collection_id));

	const collections = await getCollectionById({
		ids,
		user_id,
		user_tag: id
	});
	if (!collections) return;
	const totalStats = await prepareTotalOverallStats({
		collections,
		isBattle: true 
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
	const collectionsMeta = groupByKey(collections, "id");

	// team metadata positions are (1, 2, 3)
	team.metadata.forEach((m) => {
		battleCards[m.position - 1] = collectionsMeta[m.collection_id || 0];
	});
	return {
		totalStats: {
			...totalStats?.totalOverallStats,
			health: prepareHPBar(),
			character_level: skewed.character_level,
			critDamage: 1,
			effective: 1
		},
		id,
		cards: battleCards,
		name: `Team ${team.name}`,
	} as BattleStats;
};
