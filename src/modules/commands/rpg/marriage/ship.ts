import { BaseProps } from "@customTypes/command";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { getIdFromMentionedString, randomNumber } from "helpers";
import loggers from "loggers";

const prepareLoveBar = (score = 0) => {
	const num = 10;
	let arr = Array(num).fill(emoji.e2);
	if (score <= 0) {
		arr[0] = emoji.e1;
		arr[num - 1] = emoji.e3;
	} else if (score >= 100) {
		arr = Array(num).fill(emoji.pink2);
		arr[0] = emoji.pink1;
		arr[num - 1] = emoji.pink3;
	} else {
		const total = Math.ceil(num * (score / 100));
		arr = Array(total).fill(emoji.pink2);
		arr[0] = emoji.pink1;
		const diff = num - total;
		const empty = Array(diff).fill(emoji.e2);
		empty[diff - 1] = emoji.e3;
		arr = [ ...arr, ...empty ];
	}
	return arr;
};

const getText = (score = 0) => {
	if (score <= 10) {
		return "It was never gonna work out 💔";
	} else if (score <= 25) {
		return "Meh, could do better ❤️‍🩹";
	} else if (score <= 60) {
		return "Aw, Your ship has just started sailing. ❤️";
	} else if (score <= 70) {
		return "There is some wind in your sails! Kawaiiii 💓";
	} else if (score <= 90) {
		return "The ship is sailing strong! Cute couple 💗";
	}
	return "You're a Perfect Match! ❤️‍🔥";
};

export const shipCouple = async ({
	context,
	options,
	client,
	args,
}: BaseProps) => {
	try {
		const { author } = options;
		const id = getIdFromMentionedString(args.shift());
		let ship = author;
		if (id !== "") {
			const mentionedUser = await client.users.fetch(id);
			if (mentionedUser) {
				ship = mentionedUser;
			}
		}
		let score = randomNumber(0, 100);
		let desc = getText(score);
		if (ship.id === author.id) {
			score = 100;
			desc = "You are perfect! ❤️‍🔥";
		}

		const loveBar = prepareLoveBar(score);
		const embed = createEmbed(author)
			.setTitle(`${emoji.heart} ${author.username} x ${ship.username} Compatibility ${emoji.heart}`)
			.setThumbnail(author.displayAvatarURL())
			.setImage(ship.displayAvatarURL())
			.setHideConsoleButtons(true)
			.setDescription(
				`${loveBar
					.map((x) => x)
					.join("")} 💗 ${score}%\n**${desc}**`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("marriage.shipCouple: ERROR", err);
		return;
	}
};
