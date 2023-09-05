import { BaseProps } from "@customTypes/command";
import { getCharacters } from "api/controllers/CharactersController";
import { groupCollectionsByCharacterId } from "api/controllers/CollectionsController";
import { getMarriage } from "api/controllers/MarriagesController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import emoji from "emojis/emoji";
import loggers from "loggers";
import { titleCase } from "title-case";

const badges = [
	{
		id: 1,
		name: "Heartseeker",
		emoji: emoji.heartseekerbadge,
		criteria: {
			has: [ "rakan", "yuumi", "xayah" ],
			married: 2,
		},
	},
];

export const redeemBadge = async ({
	client,
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
            `You have already redeem The ${badge.name} Badge.`);
			return;
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
		}
		return;
	} catch (err) {
		loggers.error("badges.redeem: ERROR", err);
		return;
	}
};
