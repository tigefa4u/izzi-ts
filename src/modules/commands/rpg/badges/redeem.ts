import { BaseProps } from "@customTypes/command";
import { getCharacters } from "api/controllers/CharactersController";
import { groupCollectionsByCharacterId } from "api/controllers/CollectionsController";
import { getDonation } from "api/controllers/DonationsController";
import { getMarriage } from "api/controllers/MarriagesController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import loggers from "loggers";
import { titleCase } from "title-case";

export const badges = [
	{
		id: 1,
		name: "Heartseeker",
		emoji: emoji.heartseekerbadge,
		criteria: {
			has: [ "rakan", "yuumi", "xayah" ],
			married: 2,
		},
		description: "Must have all 3 cards from Heartseeker Event or married for 2 or more years to redeem."
	},
	{
		id: 2,
		name: "Level 75",
		emoji: emoji.lvl75,
		criteria: { level: 75 },
		description: "Must be at least level 75 or above."
	},
	{
		id: 3,
		name: "Level 150",
		emoji: emoji.lvl150,
		criteria: { level: 150 },
		description: "Must be at least level 150 or above."
	},
	{
		id: 4,
		name: "OG",
		emoji: emoji.og,
		criteria: { years: 2 },
		description: "Must have started Izzi more than 2+ years ago."
	},
	{
		id: 5,
		name: "Rich",
		emoji: emoji.rich,
		criteria: { gold: 900000000 },
		description: `Must have collected 900,000,000 Gold ${emoji.gold}.`
	},
	{
		id: 6,
		name: "Top G",
		emoji: emoji.topg,
		criteria: { donation: 500 },
		description: "Redeemable only by donators. Signed by hoax."
	},
];

export const redeemBadge = async ({
	context,
	options,
	args,
}: BaseProps) => {
	try {
		const { author } = options;
		const id = Number(args.shift());
		if (isNaN(id) || !id || id <= 0) {
			context.channel?.sendMessage(
				"We could not find the Badge you were looking for."
			);
			return;
		}
		const badge = badges.find((b) => b.id === id);
		if (!badge) {
			context.channel?.sendMessage(
				"We could not find the Badge you were looking for."
			);
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (user.metadata?.badge?.name?.toLowerCase() === badge.name.toLowerCase()) {
			context.channel?.sendMessage(`Summoner **${author.username}**, ` +
            `You have already redeem The ${badge.name} Badge ${badge.emoji}.`);
			return;
		}
		if (badge.criteria.gold && user.gold < badge.criteria.gold) {
			context.channel?.sendMessage(`Summoner **${author.username}**, ` +
			`You must currently have at least __${numericWithComma(badge.criteria.gold)}__ Gold ${emoji.gold} ` +
			"to claim this badge.");
			return;
		}
		if (badge.criteria.years) {
			const dt = new Date();
			const createdAt = new Date(user.created_at);

			const days = Math.ceil(
				Math.abs(createdAt.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24)
			);
			const years = Math.floor(days / 365);
			if (years < badge.criteria.years) {
				context.channel?.sendMessage(`Summoner **${author.username}**, ` +
				"Your account must be at least 2 years old to claim this badge.");
				return;
			}
		}
		if (badge.criteria.level) {
			if (user.level < badge.criteria.level) {
				context.channel?.sendMessage(`Summoner **${author.username}**, ` +
				`You must be at least level __${badge.criteria.level}__ to claim this badge ${badge.emoji}.`);
				return;
			}
		}
		if (badge.criteria.donation) {
			const donations = await getDonation(user.user_tag);
			if (!donations) {
				context.channel?.sendMessage(`Summoner **${author.username}**, ` +
				"You must be a donator to redeem this badge.");
				return;
			}
			const total = donations.reduce((acc, r) => acc + r.amount, 0);
			if (total < badge.criteria.donation) {
				context.channel?.sendMessage(`Summoner **${author.username}**, ` +
				"You must have donated at least 500USD to redeem this badge.");
				return;
			}
		}
		if (badge.criteria.has) {
			const characters = await getCharacters({
				name: badge.criteria.has,
				isExactMatch: true,
			});
			const collections = await groupCollectionsByCharacterId(user.id, characters.map((c) => c.id));
			if (collections && collections.length === badge.criteria.has.length) {
				context.channel?.sendMessage(
					`Congratulations summoner **${author.username}** ${emoji.celebration}, ` +
                    `You have successfully redeem The **${badge.name} ${badge.emoji}** Badge.`
				);
				await updateRPGUser({ user_tag: author.id }, {
					metadata: {
						...(user.metadata || {}),
						badge
					}
				});
				return;
			} else if (user.is_married) {
				const marriage = await getMarriage({ user_tag: author.id });
				if (marriage) {
					const dt = new Date();
					const createdAt = new Date(marriage.created_at);

					const marriedDays = Math.ceil(
						Math.abs(createdAt.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24)
					);
					const marriedYears = Math.floor(marriedDays / 365);
					if (marriedYears >= badge.criteria.married) {

						context.channel?.sendMessage(
							`Congratulations summoner **${author.username}** ${emoji.celebration}, ` +
                    `You have successfully redeem The **${badge.name} ${badge.emoji}** Badge.`
						);
						await updateRPGUser({ user_tag: author.id }, {
							metadata: {
								...(user.metadata || {}),
								badge
							}
						});
						return;
					}
				}
			}
			context.channel?.sendMessage(`Summoner **${author.username}**, You must either have ` +
            `**${badge.criteria.has.map((b) => titleCase(b)).join(", ")} Cards** or be Married for 2 or more years ` +
            `to redeem the **${badge.name} ${badge.emoji}** Badge`);
			return;
		}
		context.channel?.sendMessage(
			`Congratulations summoner **${author.username}** ${emoji.celebration}, ` +
	`You have successfully redeem The **${badge.name} ${badge.emoji}** Badge.`
		);
		await updateRPGUser({ user_tag: author.id }, {
			metadata: {
				...(user.metadata || {}),
				badge
			}
		});
		return;
	} catch (err) {
		loggers.error("badges.redeem: ERROR", err);
		return;
	}
};
