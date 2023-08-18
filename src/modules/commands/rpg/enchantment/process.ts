import { XPGainPerRankProps } from "@customTypes";
import { CollectionParams } from "@customTypes/collections";
import {
	EnchantmentAccumulatorProps,
	PrepareRankAndFetchCardsProps,
	ProcessEnchantmentProps,
} from "@customTypes/enchantment";
import { getCollection } from "api/controllers/CollectionsController";
import { XP_GAIN_PER_RANK } from "helpers/constants";
import loggers from "loggers";

export async function prepareRankAndFetchCards({
	reqExp,
	user_id,
	card,
	withDifferentName,
	initialRequestPayload,
	stashRequestPaload,
	accumulator = [],
	forceExit = false,
	totalXpGain,
	isIterateOver = true,
	isCustomRanks = false,
	isCustomName = false,
}: PrepareRankAndFetchCardsProps<EnchantmentAccumulatorProps>): Promise<
  | {
      accumulator: EnchantmentAccumulatorProps[];
      totalXpGain: number;
    }
  | undefined
> {
	let uniqueCards = [ ...new Set(accumulator) ];
	if (forceExit || reqExp <= 0) {
		loggers.info(
			"enchantment.process.prepareRankAndFetchCards: line: 33 -> data ", uniqueCards
		);
		return {
			accumulator: uniqueCards,
			totalXpGain,
		};
	}
	const promises = [
		fetchRequiredCards({
			rank: initialRequestPayload.rank,
			limit: initialRequestPayload.bucket[initialRequestPayload.rank],
			user_id: user_id,
			reqExp,
			card,
			exclude_ids: initialRequestPayload.exclude,
			character_ids: initialRequestPayload.include,
			exclude_character_ids: initialRequestPayload.exclude_character_ids
		}),
	];
	if (stashRequestPaload) {
		promises.push(
			fetchRequiredCards({
				rank: stashRequestPaload.rank,
				limit: stashRequestPaload.bucket[stashRequestPaload.rank],
				user_id: user_id,
				reqExp,
				card,
				exclude_ids: stashRequestPaload.exclude,
				character_ids: stashRequestPaload.include,
				exclude_character_ids: stashRequestPaload.exclude_character_ids
			})
		);
	}
	const starttimer = loggers.startTimer("prepareRankAndFetchCards: started...");
	const [ result, stash ] = await Promise.all(promises);
	loggers.endTimer(starttimer);
	if (!result) {
		uniqueCards = [ ...new Set(accumulator) ];
		loggers.info(
			"enchantment.process.prepareRankAndFetchCards: line 76 -> data ",
			uniqueCards
		);
		return {
			accumulator: uniqueCards,
			totalXpGain,
		};
	}
	loggers.info(
		`enchantment.proess.prepareRankAndFetchCards: Result: ${result.length} ${initialRequestPayload.rank}, ` +
		`Stash: ${stash?.length} ${stashRequestPaload?.rank}`
	);
	accumulator = accumulator.concat(result);
	if (
		accumulator.length === initialRequestPayload.bucket[initialRequestPayload.rank]
	) {
		uniqueCards = [ ...new Set(accumulator) ];
		totalXpGain = reqExp;
		reqExp = 0;
		loggers.info(
			"enchantment.process.prepareRankAndFetchCards: line: 93 -> data ", uniqueCards
		);
		return {
			accumulator: uniqueCards,
			totalXpGain,
		};
	} else {
		const xpGain =
      (initialRequestPayload.isSameName ? 3 : 1) *
      result.length *
      XP_GAIN_PER_RANK[initialRequestPayload.rank];

		totalXpGain = totalXpGain + xpGain;
		reqExp = reqExp - xpGain;
		if (stashRequestPaload && stash && reqExp > 0) {
			const xpGainFromStash =
        (stashRequestPaload?.isSameName ? 3 : 1) *
        stash?.length *
        XP_GAIN_PER_RANK[stashRequestPaload?.rank];

			totalXpGain = totalXpGain + xpGainFromStash;
			reqExp = reqExp - xpGainFromStash;
			if (reqExp >= 0) {
				accumulator = accumulator.concat(stash);
				const { newRank, newStashRank, newCondition, newStashCondition } =
          prepareIteration(
          	initialRequestPayload.rank,
          	stashRequestPaload.rank,
          	initialRequestPayload.isSameName,
          	isCustomRanks
          );

				loggers.info(
					"prepareInteration() new Data: ",
					{
						newRank,
						newCondition,
						newStashRank,
						newStashCondition,
					}
				);
				const initialPayload = preparePayload(
					newRank || "silver",
					newCondition,
					initialRequestPayload.bucket,
					withDifferentName,
					(newCondition || isCustomName) ? initialRequestPayload.include || [] : [],
					[
						...new Set([
							...accumulator.map((a) => a.id),
							...(initialRequestPayload.exclude || []),
						]),
					],
					[
						...new Set(initialRequestPayload.exclude_character_ids || []),
					]
				);
				let stashPayload = null;
				if (newStashRank && isIterateOver) {
					stashPayload = preparePayload(
						newStashRank,
						newStashCondition,
						stashRequestPaload.bucket,
						withDifferentName,
						(newStashCondition || isCustomName) ? stashRequestPaload.include || [] : [],
						[
							...new Set([
								...accumulator.map((a) => a.id),
								...(stashRequestPaload.exclude || []),
							]),
						],
						[
							...new Set(stashRequestPaload.exclude_character_ids || []),
						]
					);
				}

				loggers.info("re-iterating function prepareRankAndFetchCards:");
				return prepareRankAndFetchCards({
					card,
					reqExp,
					user_id,
					withDifferentName,
					accumulator,
					forceExit: newRank ? false : true,
					totalXpGain,
					initialRequestPayload: initialPayload,
					stashRequestPaload: isIterateOver ? stashPayload : null,
					isCustomRanks,
				});
			} else {
				const xpGainPerRank =
          (stashRequestPaload.isSameName ? 3 : 1) *
          XP_GAIN_PER_RANK[stashRequestPaload.rank];

				const numberOfCardsToRemove = Math.floor(
					Math.abs(reqExp) / xpGainPerRank
				);
				accumulator = accumulator.concat(
					result,
					stash.slice(0, stash.length - numberOfCardsToRemove)
				);

				totalXpGain = totalXpGain - Math.abs(reqExp);
				uniqueCards = [ ...new Set(accumulator) ];
				loggers.info(
					"enchantment.process.prepareRankAndFetchCards: line: 193 -> data ",
					uniqueCards
				);
				return {
					accumulator: uniqueCards,
					totalXpGain,
				};
			}
		}
		if (reqExp < 0) {
			const xpGainPerRank =
          (initialRequestPayload.isSameName ? 3 : 1) *
          XP_GAIN_PER_RANK[initialRequestPayload.rank];

			const numberOfCardsToRemove = Math.floor(
				Math.abs(reqExp) / xpGainPerRank
			);
			accumulator = accumulator.slice(0, accumulator.length - numberOfCardsToRemove);

			totalXpGain = totalXpGain - Math.abs(reqExp);
		}
		uniqueCards = [ ...new Set(accumulator) ];
		loggers.info(
			"enchantment.process.prepareRankAndFetchCards: line: 203 -> data ",
			uniqueCards
		);
		return {
			accumulator: uniqueCards,
			totalXpGain,
		};
	}
}

export async function fetchRequiredCards({
	rank = "silver",
	user_id,
	limit,
	exclude_ids = [],
	character_ids = [],
	exclude_character_ids = []
}: ProcessEnchantmentProps) {
	const params = {
		user_id,
		rank,
		is_item: false,
		is_favorite: false,
		is_on_market: false,
		exclude_ids,
		character_ids,
		limit,
		exclude_character_ids
	} as CollectionParams & { limit: number };

	loggers.info("fetchRequiredCards: fetching data with params - ", params);
	const collections = await getCollection(params);
	if (!collections) {
		return;
	}
	return collections.map((c) => ({
		id: c.id,
		rank: c.rank,
		character_id: c.character_id,
		card_count: c.card_count || 1
	}));
}

type Key = keyof XPGainPerRankProps;
function prepareIteration(
	rank: Key,
	stashRank: Key,
	isSameName = false,
	isCustomRanks = false
) {
	const newRank: Key | null = null,
		newStashRank: Key | null = null,
		newCondition = false,
		newStashCondition = false;

	if (isCustomRanks && isSameName) {
		return {
			newRank: rank,
			newStashRank: stashRank,
			newCondition,
			newStashCondition,
		};
	}
	if (rank === "silver" && stashRank === "gold") {
		return prepareBaseIteration({
			rank,
			stashRank,
			newRank,
			newStashRank,
			isSameName,
			newCondition,
			newStashCondition,
		});
	}
	return prepareEOI({
		rank,
		stashRank,
		newRank,
		newStashRank,
		newCondition,
		newStashCondition,
	});
}

type IterationProps = {
  rank: Key;
  stashRank: Key;
  newRank: Key | null;
  newStashRank: Key | null;
  newCondition: boolean;
  newStashCondition: boolean;
  isSameName?: boolean;
};

function prepareBaseIteration({
	newRank,
	newStashRank,
	isSameName,
	newCondition,
	newStashCondition,
}: IterationProps) {
	newRank = "platinum";
	newCondition = isSameName ? true : false;
	if (isSameName === true) {
		newStashRank = "silver";
		newStashCondition = false;
	}

	return {
		newRank,
		newStashRank,
		newCondition,
		newStashCondition,
	};
}

// End of Iteration (EOI)
function prepareEOI({
	rank,
	stashRank,
	newRank,
	newStashRank,
	newCondition,
	newStashCondition,
}: IterationProps) {
	if (rank === "platinum" && stashRank === "silver") {
		newRank = "gold";
		newStashRank = "platinum";
		newCondition = false;
		newStashCondition = false;
	} else {
		newStashRank = null;
		newRank = null;
	}
	return {
		newRank,
		newStashRank,
		newCondition,
		newStashCondition,
	};
}

export function preparePayload(
	rank: keyof XPGainPerRankProps,
	condition: boolean,
	bucket: XPGainPerRankProps,
	withDifferentName: XPGainPerRankProps,
	include: number[],
	exclude: number[],
	exclude_character_ids: number[]
) {
	return {
		rank,
		isSameName: condition,
		bucket: condition ? bucket : withDifferentName,
		include,
		exclude,
		exclude_character_ids
	};
}
