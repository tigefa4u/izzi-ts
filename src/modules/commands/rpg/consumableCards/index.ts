import { XPGainPerRankProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { createEmbed } from "commons/embeds";
import { BASE_XP, XP_GAIN_EXPONENT, XP_GAIN_PER_RANK } from "helpers/constants";
import { prepareXpGainObject } from "helpers/enchantment";
import loggers from "loggers";

export const cards = ({ context, client, args, options }: BaseProps) => {
	try {
		const author = options.author;
		const baseLevel = parseInt(args.shift() || "0");
		const maxLevel = parseInt(args.shift() || "0");
		if (!baseLevel || !maxLevel || isNaN(baseLevel) || isNaN(maxLevel)) {
			context.channel?.sendMessage(
				`Summoner ${author.username}, Please specify two Levels`
			);
			return;
		}
		if (maxLevel <= baseLevel || maxLevel > 70) {
			context.channel?.sendMessage(
				"Invalid Levels provided. Levels must be between 1 and 70"
			);
			return;
		}
		const levelDiff = maxLevel - baseLevel;
		let levelCounter = 0;
		let reqExp = Math.floor(BASE_XP * baseLevel ** XP_GAIN_EXPONENT);
		while (levelCounter < levelDiff) {
			levelCounter++;
			reqExp =
        reqExp +
        Math.floor(BASE_XP * (baseLevel + levelCounter) ** XP_GAIN_EXPONENT);
		}

		const { withSameName, withDifferentName } = prepareXpGainObject(reqExp);

		const embed = createEmbed(author, client);
		embed
			.setTitle("Enchantment Consumable Cards Required")
			.addField(
				"CARDS REQUIRED WITH SAME NAME, 3x MULTIPLIER",
				`Between Level ${baseLevel} to ${maxLevel}`
			)
			.setFooter({ text: "Total EXP Gained and Total Cost depends on the cards you consume", });
		Object.keys(withSameName).map((key) => {
			embed.addField(
				key.toUpperCase(),
				`${withSameName[key as keyof XPGainPerRankProps]} Cards`,
				true
			);
		});
		embed.addField(
			"CARDS REQUIRED WITH DIFFERENT NAMES, NO MULTIPLIER",
			`Between Level ${baseLevel} to ${maxLevel}`
		);
		Object.keys(withDifferentName).map((key) => {
			embed.addField(
				key.toUpperCase(),
				`${withDifferentName[key as keyof XPGainPerRankProps]} Cards`,
				true
			);
		});
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.consumableCards.cards(): something went wrong",
			err
		);
		return;
	}
};
