import _ from "lodash";
import { NormalizeFloorProps, StageProps } from "@customTypes/stages";
import { calcPercentRatio } from "./ability";
import { getRPGUser } from "api/controllers/UsersController";
import { AuthorProps, MapProps, OverallStatsProps } from "@customTypes";
import { BASE_RANK, BOT_GLOBAL_PERMISSIONS } from "./constants";
import { BaseProps } from "@customTypes/command";
import { PLProps } from "@customTypes/powerLevel";
import { MessageComponentInteraction } from "discord.js";
import { CharacterStatProps } from "@customTypes/characters";
import { emojiMap } from "emojis";
import { titleCase } from "title-case";
import { GuildStatProps } from "@customTypes/guilds";
import { BattleStats } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import emoji from "emojis/emoji";
import { nanoid } from "nanoid";

export const generateUUID = (n: number): string => {
	return nanoid(n);
	// const add = 1;
	// let max = 12 - add;
	// if (n > max) {
	// 	return generateUUID(max) + generateUUID(n - max);
	// }
	// max = Math.pow(10, n + add);
	// const min = max / 10; // Math.pow(10, n) basically
	// const number = Math.floor(Math.random() * (max - min + 1)) + min;
	// return ("" + number).substring(add);
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
	const floors: number[] = [ ...new Set(data.map((i) => i.floor)) ];
	return {
		zone: location_id,
		floors,
	};
};

export const randomNumber = (num1: number, num2: number, float = false) => {
	return _.random(num1, num2, float);
};

export const randomElementFromArray = <T>(array: T[]) => {
	if (array.length === 1) return array[0];
	const sample = _.sample<T>(array);
	if (!sample) return array[0];
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
	const isValid = Object.keys(propsToVerify).filter(
		(k) => id === propsToVerify[k]
	);
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
	if (!id || id === "") return;
	id = id.replaceAll("<#", "").replaceAll(">", "");
	return context.guild?.channels.fetch(id);
};

export const getMentionedRole = async (
	context: BaseProps["context"],
	id: string
) => {
	if (!id || id === "") return;
	id = id.replaceAll("<@", "").replaceAll("&", "").replaceAll(">", "");
	return context.guild?.roles.fetch(id);
};

type T = {
  [key: string]: number;
};
const baseStatsRatioPercent: T = {
	silver: 10,
	gold: 20,
	platinum: 30,
	diamond: 40,
	legend: 50,
	divine: 60,
	immortal: 70,
	exclusive: 80,
	ultimate: 90,
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

export const delay = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const getIdFromMentionedString = (id = "") => {
	return id.replace(/<@!/, "").replace(/<@/, "").replace(/>/, "");
};

type ProbabilityDistributionMap = Map<
  string,
  {
    x: number;
    y: number;
  }
>;
export const probability = (chances: number[]): number => {
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

	// const distributionMap: ProbabilityDistributionMap = new Map();
	// // if (!array.every(Number)) return [ -1 ];
	// let previousNumber = chances[0];
	// chances.map((item, i) => {
	// 	if (i === 0) {
	// 		distributionMap.set(`${item}#${i}`, {
	// 			x: i,
	// 			y: item - 1
	// 		});
	// 	} else {
	// 		distributionMap.set(`${item}#${i}`, {
	// 			x: previousNumber,
	// 			y: previousNumber + (item - 1)
	// 		});
	// 	}
	// 	previousNumber = item;
	// });
	// const total = chances.reduce((acc, r) => acc + r, 0);
	// const idx = randomNumber(0, total, true);

	// const iterator = distributionMap.entries();
	// let key = "";
	// for (const [ k, v ] of iterator) {
	// 	if (idx >= v.x && idx <= v.y) {
	// 		key = k;
	// 		break;
	// 	}
	// }
	// return Number(key.split("#")[1] ?? -1);
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
		stats.vitalityBonus ? ` (+${stats.vitalityBonus})` : ""
	}\n**HP:** ${stats.strength}${
		stats.strengthBonus ? ` (+${stats.strengthBonus})` : ""
	}\n**DEF:** ${stats.defense}${
		stats.defenseBonus ? ` (+${stats.defenseBonus})` : ""
	}\n**SPD:** ${stats.dexterity}${
		stats.dexterityBonus ? ` (+${stats.dexterityBonus})` : ""
	}\n**INT:** ${stats.intelligence}${
		stats.intelligenceBonus ? ` (+${stats.intelligenceBonus})` : ""
	}\n\n**Ability**\n${emojiMap(stats.abilityname)} **${titleCase(
		stats.abilityname || ""
	)}${stats.is_passive ? "[PSV]" : ""}:** ${prepareAbilityDescription(
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
}): { totalStats: OverallStatsProps; baseStats: OverallStatsProps } => {
	const {
		stats, character_level, powerLevel, guildStats, isForBattle 
	} =
    params;
	const keys = Object.keys(stats);
	const totalStats = {} as OverallStatsProps;
	const baseStats = {} as OverallStatsProps;
	keys.forEach((stat) => {
		const key = stat as keyof CharacterStatProps;
		if (
			[ "critical", "accuracy", "evasion", "effective", "precision" ].includes(
				stat
			)
		) {
			Object.assign(totalStats, { [stat]: stats[key], });
			Object.assign(baseStats, { [stat]: stats[key], });
		} else {
			Object.assign(totalStats, {
				[stat]: calcStat(
					stats[key],
					character_level,
					powerLevel
				),
			});
			if (guildStats) {
				Object.assign(totalStats, {
					[stat]: Math.ceil(
						totalStats[key] +
              totalStats[key] *
                (guildStats[stat as keyof GuildStatProps] / 100)
					),
				});
				Object.assign(totalStats, {
					[`${stat}Bonus`]: Math.ceil(
						totalStats[key] *
              (guildStats[stat as keyof GuildStatProps] / 100)
					),
				});
			}

			Object.assign(baseStats, { [stat]: totalStats[key], });

			if (isForBattle === true) {
				if (stat === "strength") {
					Object.assign(totalStats, {
						[stat]: Math.round(
							totalStats[key] * 10
						),
						originalHp: Math.round(
							totalStats[key] * 10
						),
					});
				} else {
					Object.assign(totalStats, {
						[stat]: Math.round(
							totalStats[key]
						),
					});
				}
			}
		}
	});
	return {
		totalStats,
		baseStats,
	};
};

export const preparePlayerBase = ({
	id,
	playerStats,
	name,
	card,
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
		totalStats: playerStats,
	};
	baseStats.cards[0] = undefined;
	baseStats.cards[1] = card;
	baseStats.cards[2] = undefined;

	return baseStats;
};

export const validateChannelPermissions = (
	context: BaseProps["context"],
	ch?: string
) => {
	let hasPermission = true;
	if (!context.channel?.id) return false;
	const permissionsMap = context.guild?.me
		?.permissionsIn(ch || context.channel.id)
		?.serialize();
	for (const permission of BOT_GLOBAL_PERMISSIONS) {
		if (!permissionsMap || !permissionsMap[permission]) {
			hasPermission = false;
			break;
		}
	}
	return hasPermission;
};

export const checkReadMessagePerms = (
	context: BaseProps["context"],
	ch?: string
) => {
	if (!context.channel?.id) return false;
	const permissionsMap = context.guild?.me
		?.permissionsIn(ch || context.channel.id)
		?.serialize();
	if (permissionsMap?.READ_MESSAGE_HISTORY) return true;
	return false;
};

export const escapeSpecialCharacters = (text = "") => {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

export const parsePremiumUsername = (username: string) => {
	let parsedUsername = username;
	try {
		const regex = new RegExp(emoji.premium, "g");
		const premiumUsername = username?.replace(regex, "");
		if (premiumUsername) {
			parsedUsername = premiumUsername.trim();
		}
	} catch (err) {
		parsedUsername = username;
	}
	return parsedUsername;
};

export const numericWithComma = (num: number) => {
	const n = Number(num);
	return n.toLocaleString();
};

export const round2Decimal = (num: number) =>
	Math.round((num + Number.EPSILON) * 100) / 100;

export const findAndSwap = (array: any[], priorityOrder: any[]) => {
	if (!Array.isArray(array)) return array;
	if (!Array.isArray(array)) return priorityOrder;
	const temp: any[] = [];
	priorityOrder.map((opt) => {
		const index = array.findIndex((i) => i === opt);
		if (index >= 0) temp.push(array[index]);
	});
	return temp;
};

export const getEodTimeRemainingInSec = () => {
	const d = new Date();
	const h = d.getHours();
	const m = d.getMinutes();
	const s = d.getSeconds();
	return 24 * 60 * 60 - h * 60 * 60 - m * 60 - s;
};

export const getRemainingTimer = (timestamp: number) => {
	const dt = Math.round(new Date(timestamp).getTime() / 1000);
	return `<t:${dt}:R>`;
};

export const getRemainingHoursAndMinutes = (timestamp: number) => {
	const remainingTime =
    (new Date(timestamp).valueOf() - new Date().valueOf()) / 1000 / 60;
	const remainingHours = Math.floor(remainingTime / 60);
	const remainingMinutes = Math.floor(remainingTime % 60);

	return {
		remainingHours,
		remainingMinutes,
	};
};
