import _ from "lodash";
import { NormalizeFloorProps, StageProps } from "@customTypes/stages";
import { calcPercentRatio } from "./ability";
import { getRPGUser } from "api/controllers/UsersController";
import { AuthorProps } from "@customTypes";
import { BASE_RANK } from "./constants";
import { BaseProps } from "@customTypes/command";
import { PLProps } from "@customTypes/powerLevel";
import { MessageComponentInteraction } from "discord.js";

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
	return _.sample<T>(array);
};

export const validateAccountCreatedAt = (author: AuthorProps) => {
	const dateOffset = 24 * 60 * 60 * 1000 * 60;
	const verifyDate = new Date();
	verifyDate.setTime(verifyDate.getTime() - dateOffset);
	if (new Date(verifyDate) <= new Date(author.createdTimestamp)) return false;
	return true;
};

export const checkExistingAccount = async (id: string) => {
	const userFound = await getRPGUser({ user_tag: id });
	if (userFound) return true;
	return false;
};

export const buttonInteractionFilter = (id: string) => {
	return (interaction: MessageComponentInteraction) =>
		interaction.user.id === id;
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
		const isNum = Number(val);
		if (isNum) {
			if (val.length > 16) {
				args[i] = BigInt(val).toString().replace("n", "").replace("-", "");
			} else {
				args[i] = Math.abs(parseInt(val)).toString();
			}
		}
	});
	return args;
};

export const delay = async (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const getIdFromMentionedString = (id: string) => {
	return id.replace(/<@!/, "").replace(/>/, "");
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

export const getMemberPermissions = async (context: BaseProps["context"], id: string) => {
	const member = await context.guild?.members.fetch(id);
	const permissions = member?.permissions.serialize();
	return permissions;
};