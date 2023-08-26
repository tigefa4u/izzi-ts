import { BaseProps } from "@customTypes/command";
import { getMarriage } from "api/controllers/MarriagesController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import loggers from "loggers";

export const showMarriageProfile = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user || !user.is_married) {
			context.channel?.sendMessage(`Summoner **${author.username}**, ` +
			"you are currently not married.");
			return;
		}
		const marriages = await getMarriage({ user_tag: author.id });
		if (!marriages || !marriages.married_to_username) {
			context.channel?.sendMessage(
				`Summoner **${author.username}**, ` +
          "you are married to unknown, please contact support"
			);
			return;
		}
		const marriedToUser = await client.users.fetch(marriages.married_to);
		const dt = new Date();
		const createdAt = new Date(marriages.created_at);

		let marriedDays = Math.ceil(
			Math.abs(createdAt.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24)
		);
		const marriedYears = Math.floor(marriedDays / 365);
		marriedDays = Math.floor(marriedDays % 365);

		const embed = createEmbed(author, client)
			.setTitle("Marriage :two_hearts:")
			.setDescription(
				`**${author.username}** and **${
					marriedToUser.username || marriages.married_to_username
				}** ` +
          `are happily married for **__${
          	marriedYears > 0 ? ` ${marriedYears} Year(s) ` : ""
          }${marriedDays > 0 ? ` ${marriedDays} Day(s)` : ""}__**`
			);

		if (marriedToUser) {
			embed.setImage(marriedToUser.displayAvatarURL());
		}

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("marriage.showMarriage.showMarriageProfile: ERROR", err);
		return;
	}
};
