import { BaseProps } from "@customTypes/command";
import { ProcessQuestProps } from "@customTypes/quests";
import { getUserQuests } from "api/controllers/UserQuestsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import {  Message } from "discord.js";
import { PAGE_FILTER, QUEST_TYPES, STAR } from "helpers/constants/constants";
import { createEmbedList } from "helpers/embedLists";
import { createQuestList } from "helpers/embedLists/quests";
import loggers from "loggers";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { processCardLeveling } from "./functions/cardleveling";
import { processConsumeFodderQuest } from "./functions/fodders";
import { processMarketPurchaseQuest, processMarketQuest } from "./functions/market";
import { processRaidChallengeQuest } from "./functions/raidChallenge";
import { processRaidMvpQuest } from "./functions/raidMvp";
import { processTradingQuest } from "./functions/trading";

export const quests = async ({ options, context, client }: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user || user.is_banned) return;
		const filter = PAGE_FILTER;
		let sentMessage: Message | undefined;
		let embed = createEmbed(author, client)
			.setDescription(
				"There are currently no quests available. Check back later."
			)
			.setHideConsoleButtons(true);
		const buttons = await paginatorInteraction(
			context.channel,
			author.id,
			{
				level: user.level,
				user_tag: author.id,
			},
			filter,
			getUserQuests,
			(data, options) => {
				if (data?.data) {
					const completedQuests = data.data.filter((q) => q.hasCompleted);
					const remainingQuests = data.data.filter((q) => !q.hasCompleted);
					const list = createQuestList(
						remainingQuests,
						data.metadata.currentPage,
						data.metadata.perPage
					);
					embed = createEmbedList({
						author,
						list,
						totalCount: data.metadata.totalCount,
						totalPages: data.metadata.totalPages,
						currentPage: data.metadata.currentPage,
						client,
						pageCount: data.data.length,
						title: `__Adventure Quests [${data.data[0].difficulty}]__`,
						description:
              "All of your Quests are listed below.\n" +
              `**You have Completed __${completedQuests.length}__ Quests**`,
						pageName: "quests",
						extraFooterText: `${STAR} = daily / weekly quests`
					}).setHideConsoleButtons(true);
				}
				if (options?.isEdit) {
					sentMessage?.editMessage(embed);
				} else if (options?.isDelete) {
					sentMessage?.deleteMessage();
				}
			}
		);
		if (buttons) {
			embed.setButtons(buttons);
		}
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("rpg.quests.index: ERROR", err);
		return;
	}
};

export const validateAndCompleteQuest = async <ET>(
	params: ProcessQuestProps<ET>
) => {
	try {
		switch (params.type) {
			case QUEST_TYPES.CARD_LEVELING:
				processCardLeveling<any>(params);
				break;
			case QUEST_TYPES.RAID_CHALLENGE:
				processRaidChallengeQuest<any>(params);
				break;
			case QUEST_TYPES.RAID_CARRY:
				processRaidMvpQuest<any>(params);
				break;
			case QUEST_TYPES.TRADING:
				processTradingQuest<any>(params);
				break;
			case QUEST_TYPES.MARKET:
				processMarketQuest<any>(params);
				break;
			case QUEST_TYPES.MARKET_PURCHASE:
				processMarketPurchaseQuest<any>(params);
				break;
			case QUEST_TYPES.CONSUME_FODDERS:
				processConsumeFodderQuest<any>(params);
				break;
			case QUEST_TYPES.DUNGEON:
				break;
			case QUEST_TYPES.PVP:
				break;
			case QUEST_TYPES.WORLD_BOSS:
				break;
			case QUEST_TYPES.WEBPAGES:
				break;
			default:
				break;
		}
		return;
	} catch (err) {
		loggers.error("rpg.quests.index.validateAndCompleteQuest: ERROR", err);
		throw err;
	}
};
