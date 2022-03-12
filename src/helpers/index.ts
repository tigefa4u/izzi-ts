import _ from "lodash";
import { NormalizeFloorProps, StageProps } from "@customTypes/stages";
import { calcPercentRatio } from "./ability";
import { getRPGUser } from "api/controllers/UsersController";
import { AuthorProps, MapProps, OverallStatsProps } from "@customTypes";
import { BASE_RANK } from "./constants";
import { BaseProps } from "@customTypes/command";
import { PLProps } from "@customTypes/powerLevel";
import { MessageComponentInteraction } from "discord.js";
import { CharacterStatProps } from "@customTypes/characters";
import { emojiMap } from "emojis";
import { titleCase } from "title-case";
import { GuildStatProps } from "@customTypes/guilds";
import { BattleStats } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { clone } from "utility";

export const generateUUID = (n: number): string => {
	const add = 1;
	let max = 12 - add;
	if (n > max) {
		return generateUUID(max) + generateUUID(n - max);
	}
	max = Math.pow(10, n + add);
	const min = max / 10; // Math.pow(10, n) basically
	const number = Math.floor(Math.random() * (max - min + 1)) + min;
	return ("" + number).substring(add);
};

export const prepareAbilityDescription = (desc = "", rank?: string) => {
	return desc
		.replace(/\{(.*?)\}/gm, (num) => replaceDescriptionNumber(num, rank))
		.replace(/\[(.*?)\]/gm, (num) =>
			parseInt(num.match(/\[([^)]+)\]/)?.[1] || "0").toString()
		);
};

export const replaceDescriptionNumber = (numStr: string, rank = BASE_RANK) => {
	const num = parseInt(numStr.match(/\{([^)]+)\}/)?.[1] || "0");
	return calcPercentRatio(num, rank).toString();
};

export const normalizeFloors: (data: StageProps[]) => NormalizeFloorProps = (
	data
) => {
	const location_id = Number((data[0] || {}).location_id || 0);
	const floors: number[] = data.map((i) => i.floor);
	return {
		zone: location_id,
		floors,
	};
};

export const randomNumber = (num1: number, num2: number, float = false) => {
	return _.random(num1, num2, float);
};

export const randomElementFromArray = <T>(array: T[]) => {
	const sample = _.sample<T>(array);
	if (!sample)  return array[0];
	return sample;
};

export const validateAccountCreatedAt = (author: AuthorProps) => {
	const dateOffset = 24 * 60 * 60 * 1000 * 60;
	const verifyDate = new Date();
	verifyDate.setTime(verifyDate.getTime() - dateOffset);
	if (new Date(verifyDate) <= new Date(author.createdTimestamp)) return false;
	return true;
};

export const checkExistingAccount = async (id: string) => {
	const userFound = await getRPGUser({ user_tag: id }, { cached: true });
	if (userFound) return true;
	return false;
};

export const verifyFilter = (id: string, propsToVerify: MapProps): boolean => {
	let flag = false;
	const isValid = Object.keys(propsToVerify).filter((k) => id === propsToVerify[k]);
	if (isValid.length > 0) {
		flag = true;
	}
	return flag;
};

export const interactionFilter = (
	id: string,
	cb?: (id: string, props: MapProps) => boolean,
	props?: MapProps
) => {
	return (interaction: MessageComponentInteraction) => {
		let isValid = interaction.user.id === id;
		if (cb) {
			isValid = isValid && cb(interaction.customId, props || {});
		}
		return isValid;
	};
};

export const getMentionedChannel = async (
	context: BaseProps["context"],
	id: string
) => {
	const channel = context.guild?.channels.cache.get(id);
	return channel;
};

type T = {
  [key: string]: number;
};
const baseStatsRatioPercent: T = {
	silver: 40,
	gold: 60,
	platinum: 80,
	diamond: 100,
	legend: 120,
	divine: 140,
	immortal: 160,
	exclusive: 180,
	ultimate: 200,
};

export const baseStatRatio = (stat: number, rank: string) =>
// the stat ratio is for level 1
	Math.floor(stat + stat * (baseStatsRatioPercent[rank] / 100));

export const calcPower = (
	levelStats: PLProps,
	currentLevel: number,
	statValue: number
) => {
	// stat = (stat at max level / number of levels * current level) + initial value
	const { max_power, max_level } = levelStats;
	return Math.floor((max_power / max_level) * currentLevel) + statValue;
};

export const calcStat = (
	stat: number,
	character_level: number,
	levelPower: PLProps
) => {
	const temp = baseStatRatio(stat, levelPower.rank);
	// compute max power since there's a % inc with each level
	levelPower.max_power = Math.round(
		stat * ((baseStatsRatioPercent[levelPower.rank] + 20) / 100)
	);
	return calcPower(levelPower, character_level, temp);
};

export const sanitizeArgs = (args: string[]) => {
	args.map((val, i) => {
		const num = Number(val);
		if (num) {
			if (num <= 0) {
				args.splice(i, 1);
				return;
			}
			if (val.length < 24) {
				if (val.length > 16) {
					args[i] = BigInt(val).toString().replace("n", "").replace("-", "");
				} else {
					args[i] = Math.abs(parseInt(val)).toString();
				}
			} else {
				args.splice(i, 1);
			}
		}
	});
	return args;
};

export const delay = async (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const getIdFromMentionedString = (id = "") => {
	return id.replace(/<@!/, "").replace(/<@/, "").replace(/>/, "");
};

export const probability = (chances: number[]) => {
	let sum = 0;
	chances.forEach(function (chance) {
		sum += chance;
	});
	const rand = Math.random();
	let chance = 0;
	for (let i = 0; i < chances.length; i++) {
		chance += chances[i] / sum;
		if (rand < chance) {
			return i;
		}
	}

	// should never be reached unless sum of probabilities is less than 1
	// due to all being zero or some being negative probabilities
	return -1;
};

export const getMemberPermissions = async (
	context: BaseProps["context"],
	id: string
) => {
	const member = await context.guild?.members.fetch(id);
	const permissions = member?.permissions.serialize();
	return permissions;
};

type G = {
  abilityname: string;
  abilitydescription?: string;
  itemname?: string;
  itemdescription?: string;
  is_passive?: boolean;
};

export const prepareStatsDesc = <T extends OverallStatsProps>(
	stats: T & G,
	rank = "silver"
) => {
	const desc = `**ATK:** ${stats.vitality}${
		stats.vitalityBonus ? ` (-${stats.vitalityBonus})` : ""
	}\n**HP:** ${stats.strength}${
		stats.strengthBonus ? ` (-${stats.strengthBonus})` : ""
	}\n**DEF:** ${stats.defense}${
		stats.defenseBonus ? ` (-${stats.defenseBonus})` : ""
	}\n**SPD:** ${stats.dexterity}${
		stats.dexterityBonus ? ` (-${stats.dexterityBonus})` : ""
	}\n**INT:** ${stats.intelligence}${
		stats.intellegenceBonus ? ` (-${stats.intellegenceBonus})` : ""
	}\n\n**Ability**\n${emojiMap(stats.abilityname)} **${titleCase(
		stats.abilityname || ""
	)} ${stats.is_passive ? "[PSV]" : ""}:** ${prepareAbilityDescription(
		stats.abilitydescription,
		rank
	)}${
		stats.itemname
			? `\n${emojiMap(stats.itemname)} **${titleCase(stats.itemname)}:** ${
				stats.itemdescription
			}`
			: ""
	}`;

	return desc;
};

export const overallStats = (params: {
  stats: CharacterStatProps;
  character_level: number;
  powerLevel: PLProps;
  guildStats?: GuildStatProps;
  isForBattle?: boolean;
}): { totalStats: OverallStatsProps; baseStats: OverallStatsProps; } => {
	const {
		stats, character_level, powerLevel, guildStats, isForBattle 
	} =
    params;
	const keys = Object.keys(stats);
	const totalStats = {} as OverallStatsProps;
	const baseStats = {} as OverallStatsProps;
	keys.forEach((stat) => {
		if (
			[ "critical", "accuracy", "evasion", "effective", "precision" ].includes(
				stat
			)
		) {
			Object.assign(totalStats, { [stat]: stats[stat as keyof CharacterStatProps], });
		} else {
			Object.assign(totalStats, {
				[stat]: calcStat(
					stats[stat as keyof CharacterStatProps],
					character_level,
					powerLevel
				),
			});
			if (guildStats) {
				Object.assign(totalStats, {
					[stat]: Math.ceil(
						totalStats[stat as keyof CharacterStatProps] +
              totalStats[stat as keyof CharacterStatProps] *
                (guildStats[stat as keyof GuildStatProps] / 100)
					),
				});
				Object.assign(totalStats, {
					[`${stat}Bonus`]: Math.ceil(
						stats[stat as keyof CharacterStatProps] *
              (guildStats[stat as keyof GuildStatProps] / 100)
					),
				});
			}

			Object.assign(baseStats, { [stat]: totalStats[stat as keyof CharacterStatProps] });
			
			if (isForBattle === true) {
				if (stat === "strength") {
					Object.assign(totalStats, {
						[stat]: Math.round(
							totalStats[stat as keyof CharacterStatProps] * 10
						),
						originalHp: Math.round(
							totalStats[stat as keyof CharacterStatProps] * 10
						),
					});
				} else {
					Object.assign(totalStats, {
						[stat]: Math.round(
							totalStats[stat as keyof CharacterStatProps] * 3
						),
					});
				}
			}
		}
	});

	return {
		totalStats,
		baseStats 
	};
};

export const preparePlayerBase = ({
	id,
	playerStats,
	name,
	card
}: {
	id: string;
	card: CollectionCardInfoProps;
	name: string;
	playerStats: BattleStats["totalStats"];
}) => {
	const baseStats: BattleStats = {
		id,
		cards: [],
		name,
		totalStats: playerStats
	};
	baseStats.cards[0] = undefined;
	baseStats.cards[1] = card;
	baseStats.cards[2] = undefined;

	return baseStats;
};