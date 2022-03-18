import { XPGainPerRankProps } from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";
import {
	ComputedReturnType,
	EnchantmentAccumulatorProps,
	PrepareRankAndFetchCardsProps,
	ProcessEnchantmentProps,
} from "@customTypes/enchantment";
import { getCharacterInfo } from "api/controllers/CharactersController";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import {
	BASE_XP,
	ENCHANTMENT_ALLOWED_RANKS,
	XP_GAIN_EXPONENT,
} from "helpers/constants";
import { prepareXpGainObject } from "helpers/enchantment";
import loggers from "loggers";
import { prepareRankAndFetchCards } from "./process";

async function calcLevelGain({
	totalXpGain,
	card,
}: {
  totalXpGain: number;
  card: CollectionCardInfoProps;
}) {
	const powerLevel = await getPowerLevelByRank({ rank: card.rank });
	if (!powerLevel) {
		throw new Error("Unable to fetch powerlevel for rank: " + card.rank);
	}
	if (card.character_level >= powerLevel.max_level) {
		return {
			levelCounter: 0,
			r_exp: card.r_exp,
			exp: card.exp,
		};
	}
	let totalGain = totalXpGain + card.exp;
	let levelCounter = 0;
	let reqExp = 0;
	const levelDiff = powerLevel.max_level - card.character_level;
	while (levelCounter < levelDiff) {
		const gain = Math.floor(BASE_XP * (card.character_level + levelCounter) ** XP_GAIN_EXPONENT);
		reqExp = reqExp + gain;
		const diff = totalGain - gain;
		levelCounter++;
		if (diff < 0) break;
		totalGain = diff;
	}
	if (totalGain < 0) {
		totalGain = 0;
	}
	return {
		levelCounter,
		r_exp: Math.floor(BASE_XP * (card.character_level + levelCounter) ** XP_GAIN_EXPONENT),
		exp: totalGain,
		reqExp
	};
}

export const preComputeRequiredCards = async ({
	card,
	name,
	rank,
	user_id,
	exclude_ids,
	character_ids = [],
	channel,
}: ProcessEnchantmentProps): Promise<ComputedReturnType | undefined> => {
	try {
		const currentExp = card.exp;
		let reqExp = await prepareRequiredExp({ card: card });
		if (typeof reqExp === "object") {
			return reqExp as ComputedReturnType;
		}
		reqExp = reqExp - currentExp; // Card already has some exp
		const { withSameName, withDifferentName } = prepareXpGainObject(reqExp);

		const params = {
			exclude_ids,
			user_id,
			reqExp,
			withDifferentName,
			totalXpGain: 0,
			card,
			isCustomRanks: rank ? true : false,
		} as PrepareRankAndFetchCardsProps<EnchantmentAccumulatorProps>;

		rank = safeParseRank(rank);
		const payloadRank = preparePayloadRank(rank);
		if (!payloadRank.rank) return;
		params.initialRequestPayload = {
			isSameName: true,
			bucket: withSameName,
			rank: payloadRank.rank,
			include: [ ...new Set([ ...(character_ids || []), card.character_id ]) ],
			exclude: [ ...new Set(exclude_ids) ],
		};
		params.stashRequestPaload = payloadRank.stashRank
			? {
				isSameName: true,
				bucket: withSameName,
				rank: payloadRank.stashRank,
				include: [ ...new Set([ ...(character_ids || []), card.character_id ]) ],
				exclude: [ ...new Set(exclude_ids) ],
			}
			: null;

		if (name) {
			const charaInfo = await getCharacterInfo({
				name,
				isExactMatch: true 
			});
			if (charaInfo && charaInfo.length > 0) {
				const character = charaInfo[0];
				const isSameCharacter = card.character_id === character.id;
				if (isSameCharacter) {
					character_ids?.push(card.character_id);
				} else {
					character_ids?.push(character.id);
				}

				params.isCustomName = true;
				params.isIterateOver = false;
				params.initialRequestPayload.include = [ ...new Set(character_ids) ];
				params.initialRequestPayload.isSameName = isSameCharacter;
				params.initialRequestPayload.bucket = isSameCharacter
					? withSameName
					: withDifferentName;

				if (params.stashRequestPaload) {
					params.stashRequestPaload.include = [ ...new Set(character_ids) ];
					params.stashRequestPaload.isSameName = isSameCharacter;
					params.stashRequestPaload.bucket = isSameCharacter
						? withSameName
						: withDifferentName;
				}
			}
		} else {
			if (rank?.length === 1) {
				params.stashRequestPaload = {
					include: [],
					exclude: [ ...new Set(exclude_ids) ],
					rank: payloadRank.rank,
					isSameName: false,
					bucket: withDifferentName,
				};
			}
		}
		params.accumulator = [];
		const result = await prepareRankAndFetchCards(params);
		if (!result || result.totalXpGain === 0 || result.accumulator.length <= 0) {
			channel?.sendMessage(
				"You do not have sufficient cards to Enchant this card."
			);
			return;
		}
		const { levelCounter, r_exp, exp } = await calcLevelGain({
			card,
			totalXpGain: result.totalXpGain,
		});
		return {
			...result,
			levelCounter,
			r_exp,
			exp,
			reqExp
		};
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.enchantment.compute.computeRequiredCards(): ",
			err
		);
		return;
	}
};

export async function prepareRequiredExp({ card, }: {
  card: CollectionCardInfoProps;
}) {
	const powerLevel = await getPowerLevelByRank({ rank: card.rank });
	if (!powerLevel) {
		throw new Error("Unable to fetch powerlevel for rank: " + card.rank);
	}
	if (card.character_level >= powerLevel.max_level) {
		return { max_level: true };
	}
	const levelDiff = powerLevel.max_level - card.character_level;
	return getReqExpBetweenLevels(card.character_level, levelDiff);
}

export function getReqExpBetweenLevels(level: number, levelDiff: number) {
	let levelCounter = 0;
	let reqExp = 0;
	while (levelCounter < levelDiff) {
		reqExp = reqExp +
      Math.floor(
      	BASE_XP * (level + levelCounter) ** XP_GAIN_EXPONENT
      );
		levelCounter++;
	}
	return reqExp;
}

type Key = keyof XPGainPerRankProps;
function preparePayloadRank(rank?: string | string[]) {
	let payloadRank: Key, stashRank: Key;
	if (
		!rank ||
    typeof rank === "string" ||
    rank.length > 2 ||
    rank.length <= 0
	) {
		payloadRank = "silver";
		stashRank = "gold";
	} else {
		payloadRank = rank[0] as Key;
		stashRank = rank[1] as Key;
	}
	return {
		rank: payloadRank,
		stashRank,
	};
}

function safeParseRank(rank?: string | string[]) {
	if (rank && rank.length > 0 && typeof rank === "object") {
		const filtered = ENCHANTMENT_ALLOWED_RANKS.filter((e) =>
			rank.find((r) => e.includes(r))
		);
		if (filtered.length > 0) {
			return [ ...new Set(filtered) ];
		}
	}
	return;
}
