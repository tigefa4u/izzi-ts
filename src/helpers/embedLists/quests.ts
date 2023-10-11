import { QuestResultProps, QuestReward } from "@customTypes/quests";
import { EmbedFieldData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { getEodTimeRemainingInSec, numericWithComma } from "helpers";
import { STAR } from "helpers/constants/constants";
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
				}${
					cids.length > 0 && reward.key === "card"
						? ` Cards **(${cids.join(", ")})**`
						: ""
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
		const secondsInEpoch = Math.round(
			new Date().setSeconds(getEodTimeRemainingInSec()) / 1000
		);
		fields.push({
			name: `#${i + 1 + (currentPage - 1) * perPage} | ${titleCase(item.name)}${
				item.criteria.toComplete && !item.hasCompleted
					? ` (${numericWithComma(item.completed || 0)} / ${numericWithComma(item.criteria.toComplete)})`
					: ""
			}${
				item.criteria.purchase
					? ` (${numericWithComma(
						item.totalMarketPurchase || 0
					)} / ${numericWithComma(item.criteria.purchase)})`
					: ""
			}${item.is_daily ? ` [${STAR} daily]` : ""}${
				item.is_weekly ? ` [${STAR} weekly]` : ""
			}${item.hasCompleted ? ` [completed] ${emoji.dance}` : ""}`,
			value: `${item.description}.${
				item.is_daily ? `**\nReset: <t:${secondsInEpoch}:R>**` : ""
			}\n**[Rewards] ${prepareRewards(item.reward)}**`,
		});
	});
	return fields;
};
