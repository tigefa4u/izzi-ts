import { BaseProps } from "@customTypes/command";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { randomNumber } from "helpers";
import { GAMBLE_EMOJIS } from "helpers/constants";
import loggers from "loggers";

const bucket = [
	{
		name: "heads",
		alias: [ "h", "head", "heads" ],
	},
	{
		name: "tails",
		alias: [ "t", "tail", "tails" ],
	},
];
const validateBetArgs = function (args: string | undefined) {
	if (!args) return;
	const index = bucket.find((i) => {
		const flipIndex = i.alias.findIndex((f) => f == args);
		if (flipIndex >= 0) return i;
		return false;
	});
	if (!index) return false;
	return index.name;
};

export const bet = async ({ message, args = [], options }: BaseProps) => {
	try {
		const author = options?.author;
		if (!author) return;
		const betAmount = parseInt(args.shift() || "0");
		if (isNaN(betAmount) || betAmount <= 0 || betAmount > 50000) {
			return message.channel.sendMessage("Invalid Bet amount");
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) throw new Error("User not found FATAL ERROR");
		if (user.gold < betAmount)
			return message.reply(" You do not have suffient gold to bet.");
		const coinFlip = validateBetArgs(args.shift());
		if (!coinFlip) throw new Error("Coin flip error");
		user.gold = Math.floor(user.gold - betAmount);
		const betFlip = Math.floor(Math.random() * 2) == 0;
		let flipString;
		if (betFlip) flipString = "heads";
		else flipString = "tails";
		const embed = createEmbed(message.member);
		if (coinFlip === flipString) {
			const winAmount = Math.floor(betAmount * randomNumber(1.7, 1.9, true));
			user.gold = user.gold + winAmount;
			embed
				.setTitle("Success!")
				.setDescription(
					`It was **${flipString}!**\n\ncongratulations! ${emoji.celebration} you won __${
						winAmount
					}__g`
				)
				.setThumbnail(GAMBLE_EMOJIS.win);
		} else {
			embed
				.setTitle(`Fail! ${emoji.cry}`)
				.setDescription(
					`Try again next time. The coin flipped on **${flipString}!**\n\n`
				)
				.setThumbnail(GAMBLE_EMOJIS.loss);
		}
		await updateRPGUser({ user_tag: author.id }, { gold: user.gold });
		message.channel.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("module.commands.basic.gamble.bet: something went wrong", err);
		return;
	}
};