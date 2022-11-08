import { BaseProps } from "@customTypes/command";
import { getRandomCard } from "api/controllers/CardsController";
import { createCollection } from "api/controllers/CollectionsController";
import {
	createReferral,
	getReferral,
	getReferrals,
} from "api/controllers/ReferralsController";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { getIdFromMentionedString } from "helpers";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	MAX_REFERRAL_REWARD_POINTS,
} from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import loggers from "loggers";
import { titleCase } from "title-case";

export const useReferrals = async ({
	context,
	options,
	args,
	client,
}: BaseProps) => {
	try {
		const author = options.author;
		const key = "referral::" + author.id;
		const hasReferred = await Cache.get(key);
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (hasReferred) {
			embed.setDescription(
				`Summoner **${author.username}**, You have already used your referral.`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const mentionId = getIdFromMentionedString(args.shift());
		let errorMessage = "";
		if (!mentionId) {
			errorMessage = "Please enter a valid user ID.";
		} else if (mentionId === author.id) {
			errorMessage = "You cannot refer yourself.";
		}
		if (errorMessage) {
			embed.setDescription(`Summoner **${author.username}**, ${errorMessage}`);
			context.channel?.sendMessage(embed);
			return;
		}
		const [ mentionedUser, referralUsed, referrals ] = await Promise.all([
			getRPGUser({ user_tag: mentionId }),
			getReferral({ user_tag: author.id }),
			getReferrals({ referred_to: mentionId }),
		]);
		if (!mentionedUser) {
			errorMessage =
        "The summoner you are trying to refer has not started their journey in the Xenverse. " +
        "Use ``@izzi start`` to start your journey in the Xenverse.";
		} else if (referralUsed) {
			errorMessage = "You have already used your referral.";
		}
		if (errorMessage) {
			embed.setDescription(`Summoner **${author.username}**, ${errorMessage}`);
			context.channel?.sendMessage(embed);
			return;
		}
		/**
     * Reward the user being referred for every 5th
     * referral up to 20. (non tradable immo card)
     */
		const referralsCount = (referrals?.length || 0) + 1;
		if (
			referralsCount % 5 === 0 &&
      referralsCount <= MAX_REFERRAL_REWARD_POINTS
		) {
			const randomCard = await getRandomCard({
				is_event: false,
				rank: "immortal",
				is_referral_card: true,
				is_random: true
			}, 1);
			// get random non tradable card
			const card = (randomCard || [])[0];
			const rewardEmbed = createEmbed(undefined, client)
				.setTitle("Referral Reward");
			if (!card) {
				rewardEmbed.setDescription("There are currently no referral rewards.");
			} else {
				if (!mentionedUser) {
					loggers.info("referralCard.refer: Unable to find user with mentionId: " 
					+ mentionId + " card created: " + JSON.stringify(card));
				}
				await createCollection({
					character_id: card.character_id,
					character_level: 20,
					exp: 1,
					r_exp: 15,
					is_tradable: false,
					is_item: false,
					is_on_cooldown: false,
					rank: "immortal",
					rank_id: 7,
					user_id: mentionedUser?.id || 1
				});
				rewardEmbed.setDescription(
					`Congratulations summoner **${
						mentionedUser?.username
					}**, You have received 1x **Level 20** __${titleCase(
						card.rank
					)}__ **${titleCase(
						card.name
					)}** (Non Tradable).\nYou currently have **__${referralsCount}__** referrals`
				);
			}
			DMUser(client, rewardEmbed, mentionId);
		}
		await Promise.all([
			createReferral({
				user_tag: author.id,
				referred_to: mentionId,
			}),
			Cache.set(key, JSON.stringify({ referred_to: mentionId })),
		]);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Summoner **${author.username}**, You have successfully ` +
          `referred summoner **${mentionedUser?.username}**`
			);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("basic.referrals.refer.useReferrals: ERROR", err);
		return;
	}
};
