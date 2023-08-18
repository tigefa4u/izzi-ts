import {
	ComputedReturnType,
	EnchantmentAccumulatorPropsV2,
	PrepareRankAndFetchCardsProps,
	ProcessEnchantmentProps,
} from "@customTypes/enchantment";
import { getCharacterInfo } from "api/controllers/CharactersController";
import { prepareXpGainObject } from "helpers/enchantment";
import loggers from "loggers";
import { calcLevelGain, prepareRequiredExp } from "../compute";
import { prepareRankAndFetchCardsV2 } from "./process";

/**
 * This version of ENH command only consumes platinum
 * fodders. Few logic is still the same & reused from v1.
 * @param param0
 * @returns
 */
export const preComputeRequiredCardsV2 = async ({
	card,
	name,
	user_id,
	exclude_ids,
	character_ids = [],
	channel,
	exclude_character_ids,
	limit
}: ProcessEnchantmentProps): Promise<ComputedReturnType<EnchantmentAccumulatorPropsV2> | undefined> => {
	try {
		const currentExp = card.exp;
		const reqExpobj = await prepareRequiredExp({ card: card });
		if (reqExpobj.has_reached_max_level) {
			return { has_reached_max_level: true } as ComputedReturnType<EnchantmentAccumulatorPropsV2>;
		}
		let reqExp = reqExpobj.exp;
		if (!reqExp) {
			return;
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
			exclude_character_ids,
		} as PrepareRankAndFetchCardsProps<EnchantmentAccumulatorPropsV2>;

		if (typeof limit === "object") {
			limit = +limit[0] || 1;
			params.isCustomLimit = true;
		}

		const rank = "platinum";
		params.initialRequestPayload = {
			isSameName: true,
			bucket: withSameName,
			rank,
			include: [ ...new Set([ ...(character_ids || []), card.character_id ]) ],
			exclude: [ ...new Set(exclude_ids) ],
			exclude_character_ids: [ ...new Set(exclude_character_ids) ],
			limit: limit || withSameName.platinum,
		};

		if (name) {
			const charaInfo = await getCharacterInfo({
				name,
				isExactMatch: true,
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
				params.initialRequestPayload.include = [ ...new Set(character_ids) ];
				params.initialRequestPayload.isSameName = isSameCharacter;
				params.initialRequestPayload.bucket = isSameCharacter
					? withSameName
					: withDifferentName;
				params.initialRequestPayload.limit = limit || isSameCharacter
					? withSameName.platinum
					: withDifferentName.platinum;
			}
		}
		params.accumulator = [];
		const result = await prepareRankAndFetchCardsV2(params);
		if (!result || result.totalXpGain === 0 || result.accumulator.length <= 0) {
			channel?.sendMessage(
				"You do not have sufficient cards to Enchant this card. " +
                "To get more Fodders use ``iz packs`` or join a raid."
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
			reqExp,
			max_level: reqExpobj.max_level
		};
	} catch (err) {
		loggers.error("enchantment.v2.compute.precomputerequiredcardsV2: ERROR", err);
		return;
	}
};
