import {
	EnchantmentAccumulatorPropsV2,
	PrepareRankAndFetchCardsProps,
} from "@customTypes/enchantment";
import { getFoddersV2 } from "api/controllers/CollectionsController";
import { XP_GAIN_PER_RANK } from "helpers/constants";
import { prepareXpGainObject } from "helpers/enchantment";
import loggers from "loggers";

export const prepareRankAndFetchCardsV2 = async ({
	reqExp,
	user_id,
	card,
	withDifferentName,
	initialRequestPayload,
	accumulator = [],
	forceExit = false,
	totalXpGain,
	isCustomName = false,
	isCustomLimit = false,
}: PrepareRankAndFetchCardsProps<EnchantmentAccumulatorPropsV2>): Promise<
  | {
      accumulator: EnchantmentAccumulatorPropsV2[];
      totalXpGain: number;
    }
  | undefined
> => {
	let uniqueCards = [ ...new Set(accumulator) ];
	if (forceExit || reqExp <= 0) {
		loggers.info(
			"enchantment.process.prepareRankAndFetchCardsV2: line: 29 -> data ",
			uniqueCards
		);
		return {
			accumulator: uniqueCards,
			totalXpGain,
		};
	}
	const starttimer = loggers.startTimer(
		"prepareRankAndFetchCardsV2: started..."
	);
	const result = await getFoddersV2(
		{
			rank: initialRequestPayload.rank,
			user_id,
			exclude_ids: initialRequestPayload.exclude,
			character_ids: initialRequestPayload.include,
			exclude_character_ids: initialRequestPayload.exclude_character_ids,
		},
		{ limit: initialRequestPayload.limit || 1 }
	);
	loggers.endTimer(starttimer);
	if (!result || (result.length <= 0 && !initialRequestPayload.isSameName)) {
		uniqueCards = [ ...new Set(accumulator) ];
		loggers.info(
			"enchantment.process.prepareRankAndFetchCardsV2: line 48 -> data ",
			uniqueCards
		);
		return {
			accumulator: uniqueCards,
			totalXpGain,
		};
	}
	let remainingCount = initialRequestPayload.limit || 1;
	accumulator = accumulator.concat(
    result
    	.map((c) => {
    		if (remainingCount <= 0) return;
    		let count = 1;
    		if (!c.card_count) c.card_count = 1;
    		if (c.card_count >= remainingCount) {
    			count = remainingCount;
    			remainingCount = 0;
    		} else {
    			count = c.card_count;
    			remainingCount = remainingCount - c.card_count;
    		}
    		return {
    			id: c.id,
    			character_id: c.character_id,
    			count,
    			user_id: c.user_id,
    		};
    	})
    	.filter(Boolean) as EnchantmentAccumulatorPropsV2[]
	);

	uniqueCards = [ ...new Set(accumulator) ];
	const currentCardCount = accumulator.reduce(
		(acc, r) => (acc || 0) + r.count,
		0
	);
	if (currentCardCount >= initialRequestPayload.bucket.platinum) {
		uniqueCards = [ ...new Set(accumulator) ];
		totalXpGain = totalXpGain + reqExp;
		reqExp = 0;
		loggers.info(
			"enchantment.process.prepareRankAndFetchCardsV2: line: 82 -> data ",
			uniqueCards
		);
		return {
			accumulator: uniqueCards,
			totalXpGain,
		};
	} else {
		const xpGain =
      (initialRequestPayload.isSameName ? 3 : 1) *
      currentCardCount *
      XP_GAIN_PER_RANK.platinum;

		totalXpGain = totalXpGain + xpGain;
		reqExp = reqExp - xpGain;

		if (currentCardCount >= (initialRequestPayload.limit || 1)) {
			loggers.info("prepareRankAndFetchCardsV2: line 98 -> data", uniqueCards);
			return {
				accumulator: uniqueCards,
				totalXpGain,
			};
		}
		if (reqExp > 0 && !isCustomName) {
			const xpGainObject = prepareXpGainObject(reqExp);
			loggers.info("prepareRankAndFetchCardsV2: re-computing cards needed,", {
				reqExp,
				...xpGainObject,
			});

			/**
			 * This logic is needed to avoid consuming extra cards than required
			 */
			let recalculatedLimit = isCustomLimit
				? initialRequestPayload.limit || 1
				: xpGainObject.withDifferentName.platinum;

			if (isCustomLimit) {
				recalculatedLimit = recalculatedLimit - currentCardCount;
			}
			if (recalculatedLimit > xpGainObject.withDifferentName.platinum) {
				recalculatedLimit = xpGainObject.withDifferentName.platinum;
			}

			const payload = {
				...initialRequestPayload,
				bucket: xpGainObject.withDifferentName,
				exclude: [
					...new Set([
						...accumulator.map((a) => a.id),
						...(initialRequestPayload.exclude || []),
					]),
				],
				exclude_character_ids: initialRequestPayload.exclude_character_ids,
				limit: recalculatedLimit,
				isSameName: false,
				include: [],
			};
			loggers.info(
				"prepareRankAndFetchCardsV2: re-iterating with payload:",
				payload
			);
			return prepareRankAndFetchCardsV2({
				reqExp,
				user_id,
				card,
				withDifferentName,
				initialRequestPayload: payload,
				accumulator,
				totalXpGain,
			});
		}
		loggers.info("prepareRankAndFetchCardsV2: line 128 -> data", uniqueCards);
		return {
			accumulator: uniqueCards,
			totalXpGain,
		};
	}
};
