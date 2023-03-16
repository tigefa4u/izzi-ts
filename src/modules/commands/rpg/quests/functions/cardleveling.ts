import { ProcessQuestProps, QuestCriteria } from "@customTypes/quests";
import loggers from "loggers";
import { fetchAndCompleteQuest } from "../common";

const validateCriteria = (
	criteria: QuestCriteria,
	characterlevelAfterEnh: number,
	maxlevel: number,
	levelcounter: number
) => {
	return (
		(criteria.maxlevel && characterlevelAfterEnh === maxlevel) ||
    (criteria.incrementLevelBy && criteria.incrementLevelBy <= levelcounter)
	);
};

export type processCardLevelingExtras = {
  levelCounter: number;
  characterlevelAfterEnh: number;
  maxlevel?: number;
};
export const processCardLeveling = async <ET extends processCardLevelingExtras>(
	params: ProcessQuestProps<ET>
) => {
	try {
		const { author, channel, client } = params.options;
		loggers.info(
			"rpg.quests.functions.processCardLeveling: starting card leveling quest for user: " +
        params.user_tag
		);
		if (!params.options.extras) return;
		const { levelCounter, characterlevelAfterEnh, maxlevel } =
      params.options.extras;
		const isNotvalid =
      !levelCounter ||
      levelCounter <= 0 ||
      !characterlevelAfterEnh ||
      isNaN(levelCounter) ||
      isNaN(characterlevelAfterEnh) ||
      !maxlevel ||
      isNaN(maxlevel);

		if (isNotvalid) return;

		fetchAndCompleteQuest(params, (criteria) => {
			const isCriteriaValid = validateCriteria(
				criteria,
				characterlevelAfterEnh,
				maxlevel,
				levelCounter
			);
			return isCriteriaValid ? true : false;
		});
		return;
	} catch (err) {
		loggers.error("rpg.quests.functions.processCardLeveling: ERROR", err);
		return;
	}
};
