import { BaseProps } from "@customTypes/command";
import { getRandomCard } from "api/controllers/CardsController";
import {
	getAllReferrals,
	getReferral,
	getReferrals,
} from "api/controllers/ReferralsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { PAGE_FILTER, REFERRAL_BG_IMG_URL } from "helpers/constants/constants";
import { createEmbedList } from "helpers/embedLists";
import { createReferralsList } from "helpers/embedLists/referrals";
import loggers from "loggers";
import { titleCase } from "title-case";
import { paginatorInteraction } from "utility/ButtonInteractions";

export const viewReferralsWithPagination = async ({
	context,
	options,
	client,
}: BaseProps) => {
	try {
		const author = options.author;
		const filter = PAGE_FILTER;
		let embed = createEmbed(author, client).setDescription(
			"All of your referrals are listed below."
		);
		let sentMessage: Message;
		const buttons = await paginatorInteraction(
			context.channel,
			author.id,
			{ referred_to: author.id },
			filter,
			getAllReferrals,
			(data: any, opts) => {
				if (data) {
					const list = createReferralsList(data.data);
					embed = createEmbedList({
						author,
						list,
						currentPage: data.metadata.currentPage,
						pageCount: data.data.length,
						totalCount: data.metadata.totalCount,
						totalPages: data.metadata.totalPages,
						client,
						title: "Referrals",
						description: `You currently have __${data.metadata.totalCount}__ referral(s)`,
						pageName: "referrals",
					});
				}
				if (opts?.isDelete && sentMessage) {
					sentMessage.deleteMessage();
				}
				if (opts?.isEdit) {
					sentMessage.editMessage(embed);
				}
			}
		);
		if (!buttons) return;
		embed.setButtons(buttons).setHideConsoleButtons(true);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("basic.referrals.view.viewReferrals: ERROR", err);
		return;
	}
};

export const viewReferrals = async ({
	context,
	options,
	client,
}: BaseProps) => {
	try {
		const author = options.author;
		const [ referredBy, referrals ] = await Promise.all([
			getReferral({ user_tag: author.id }),
			getReferrals({ referred_to: author.id }),
		]);
		let mentionedUser;
		if (referredBy) {
			mentionedUser = await getRPGUser({ user_tag: referredBy.referred_to });
		}

		const referralCard = await getRandomCard(
			{
				is_event: false,
				is_referral_card: true,
				is_random: true,
				rank: "immortal"
			},
			1
		);
		const card = (referralCard || [])[0];
		const embed = createEmbed(author, client)
			.setTitle("Referrals")
			.setDescription(
				`Summoner **${author.username}**, ${
					referredBy
						? `You have been referred to Izzi by: **${mentionedUser?.username}**`
						: "Use ``refer use <referral code>`` to refer a friend"
				}${
					card
						? `\n\nFor every 5 referral points up to 40, you receive 1x **Level 20** __${titleCase(
							card.rank
						)}__ **${titleCase(card.name)}**`
						: ""
				}\n\nYour referral code: ${author.id}
				\n\n**You have referred __${referrals?.length}__ players to Izzi!**`
			)
			.setImage(REFERRAL_BG_IMG_URL);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("basic.referrals.view.viewReferrals: ERROR", err);
		return;
	}
};
