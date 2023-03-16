import { QuestResultProps, QuestReward } from "@customTypes/quests";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { titleCase } from "title-case";

export const prepareRewards = (
	rewards: QuestReward,
	forResult = false,
	cids: number[] = []
) => {
	return Object.keys(rewards)
		.map((key) => {
			const reward = rewards[key as keyof QuestReward];
			if (forResult) {
				return `• __${numericWithComma(reward.amount)}__ ${
					reward.emoji ? emojiMap(reward.emoji) : ""
				}`;
			}
			return `${titleCase(reward.name)}: __${numericWithComma(
				reward.amount
			)}__ ${reward.emoji ? emojiMap(reward.emoji) : ""}${
				cids.length > 0 ? ` **(${cids.join(", ")})**` : ""
			}${reward.description ? ` (${reward.description})` : ""}`;
		})
		.join(forResult ? "\n" : ", ");
};

export const createQuestList = (
	array: QuestResultProps[],
	currentPage: number,
	perPage: number
) => {
	const fields: EmbedFieldData[] = [];
	array.map((item, i) => {
		fields.push({
			name: `#${i + 1 + (currentPage - 1) * perPage} | ${titleCase(item.name)}${
				item.criteria.toComplete && !item.hasCompleted
					? ` (${item.completedRaids || 0} / ${item.criteria.toComplete})`
					: ""
			}${item.is_daily ? " [daily]" : ""}${
				item.hasCompleted ? ` [completed] ${emoji.dance}` : ""
			}`,
			value: `${item.description}.\n**[Rewards] ${prepareRewards(
				item.reward
			)}**`,
		});
	});
	return fields;
};
