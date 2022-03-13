import { BaseProps } from "@customTypes/command";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { BOT_VOTE_LINK, IZZI_WEBSITE, OFFICIAL_SERVER_LINK } from "environment";
import loggers from "loggers";
import { help } from ".";

export const server = ({ context }: BaseProps) => {
	try {
		context.channel?.sendMessage(
			`Join our Official Server for any assistance.\n${OFFICIAL_SERVER_LINK}` +
        `\nYou can also checkout ${IZZI_WEBSITE} for more detailed information.`
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.basic.info.server(): something went wrong",
			err
		);
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
				})`
			)
			.setDescription(
				`Vote for izzi here:-\n${BOT_VOTE_LINK}\n\n` +
          " " +
          "Use daily to gain __2000__ and 150xStreaks (up to 30)" +
          " " +
          `Gold ${emoji.gold} and 1 Raid Permit(s) (2 if married) and 5 ${emoji.shard}` +
          " " +
          "Shards (10 if premium) as you vote! You get bonus __1000__ gold if you're married!" +
          " " +
          "You get (10 to 12) IP if premium and Your mana also gets refilled as you vote."
			);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("module.commands.basic.info.daily(): something went wrong", err);
		return;
	}
};

export const donate = ({ context, client, options }: BaseProps) => {
	try {
		help({
			context,
			client,
			args: [ "donate" ],
			options 
		});
		return;
	} catch (err) {
		loggers.error("module.commands.basic.info.donate(): something went wrong", err);
		return;
	}
};
