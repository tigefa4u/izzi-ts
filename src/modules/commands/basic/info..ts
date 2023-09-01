import { BaseProps } from "@customTypes/command";
import { getDonation } from "api/controllers/DonationsController";
import { getMonthlyCard } from "api/controllers/MonthlyCardsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import {
	BOT_VOTE_LINK,
	IZZI_WEBSITE,
	OFFICIAL_SERVER_LINK,
	XENEX_VOTE_LINK,
} from "environment";
import { DONATOR_PERKS_MESSAGE } from "helpers/constants";
import { DMUser } from "helpers/directMessages";
import loggers from "loggers";
import { titleCase } from "title-case";

export const server = ({ context }: BaseProps) => {
	try {
		context.channel?.sendMessage(
			`Join our Official Server for any assistance.\n${OFFICIAL_SERVER_LINK}` +
        `\nYou can also checkout ${IZZI_WEBSITE} for more detailed information.`
		);
		return;
	} catch (err) {
		loggers.error("modules.commands.basic.info.server: ERROR", err);
		return;
	}
};

export const daily = async ({ context, client, options }: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const timestamp = user.voted_at;
		const remainingTime =
      (new Date().valueOf() - new Date(timestamp).valueOf()) / 1000 / 60;
		const remainingHours = 24 - Math.ceil(remainingTime / 60);

		const embed = createEmbed(options.author, client);
		embed
			.setTitle(
				`Daily Sign in:- (${
					user.vote_streak
						? `${user.vote_streak} :fire: streaks!`
						: "No Streaks"
				}) (${
					remainingHours > 0
						? `${remainingHours} Hour(s) Until Reset`
						: "Resets Every 24 hours"
				}) (Total Votes: ${user.vote_count || 0})`
			)
			.setDescription(
				`Vote for **__Izzi__** here:-\n${BOT_VOTE_LINK}\n\n` +
          " " +
          "Use daily to gain __2,000__ and 150xStreaks (up to 30)" +
          " " +
          `Gold ${emoji.gold} and 1 Raid Permit(s) (2 if married)` +
          " " +
          "as you vote! You get bonus __2,000__ gold if you're married!" +
          " " +
          `You get 4IP ${emoji.izzipoints} if premium and ` +
          "Your mana as well as dungeon mana also gets refilled as you vote."

				// removed in favor of monthly votes
				//   `Vote for **__Xenex Server__** here:-\n${XENEX_VOTE_LINK}\n\n` +
				//   "Use daily to gain __2000__ and 200xStreaks (up to 30) " +
				//   `Gold ${emoji.gold} and 1 Raid Permit(s) (2 if premium) and 5 ${emoji.shard} ` +
				//   "Shards (10 if premium) as you vote! You get bonus __1000__ gold if you're married!"
				//   +
				//   `You get (3 or 4) ${emoji.izzipoints} IP if premium as you vote.`
			);

		try {
			const monthlyCard = await getMonthlyCard();
			const card = (monthlyCard || [])[0];
			if (card && card.metadata?.assets?.small?.filepath) {
				embed.setThumbnail(card.metadata.assets.small.filepath);

				let imgPath = "assets/images/monthly_calender.jpeg";
				if (user.is_premium) {
					imgPath = "assets/images/premium_monthly_calender.jpeg";
				}
				const dt = new Date();
				const month = dt.toLocaleString("default", { month: "long" });
				const year = dt.getFullYear();
				const fn = `${month}-${year}.jpeg`;
				const attachment = createAttachment(imgPath, fn);
				embed.setImage(`attachment://${fn}`).attachFiles([ attachment ]);

				const cardName = titleCase(card.name || "No Name");
				embed
					.setDescription(
						embed.description +
              `\n\n**__${month} ${year}, Calender Card (Total Monthly Votes: ${user.monthly_votes})__**` +
              `\nName: **${cardName}**\nSeries: **${titleCase(card.series)}**` +
              `\nTotal Collectables: **__5x__ Immortal ${cardName}, __150x__ Platinum ${cardName} Fodders.**`
					)
					.setFooter({
						text: "After 35 votes you receive 6,000 Gold per vote",
						iconURL: author.displayAvatarURL(),
					});
			} else {
				embed.setDescription(
					embed.description + " **6,000 Gold Monthly Bonus.**"
				);
			}
		} catch (err) {
			//
		}

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("module.commands.basic.info.daily: ERROR", err);
		return;
	}
};

export const donate = async ({
	context,
	client,
	options,
	command,
}: BaseProps) => {
	try {
		if (!command) return;
		const embed = createEmbed(options.author, client)
			.setTitle(
				`Command: ${command.name} (Shortcuts: ${command.alias.join(", ")})\n${
					command.usage
				}`
			)
			.setDescription(command.description);

		const donation = (await getDonation(options.author.id)) || [];
		if (donation?.length > 0) {
			const total = donation.reduce((acc, r) => acc + r.amount, 0);
			const [ str1, str2 ] = command.description.split("! [");
			const newEmbed = createEmbed(options.author, client).setDescription(
				`${str1}! You have spent a total of __$${total.toFixed(
					2
				)}__ so far.${DONATOR_PERKS_MESSAGE}`
			);
			DMUser(client, newEmbed, options.author.id);
		}
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("module.commands.basic.info.donate: ERROR", err);
		return;
	}
};
