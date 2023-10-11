import { BaseProps } from "@customTypes/command";
import { createEmbed } from "commons/embeds";
import { prepareXpGainObject } from "helpers/enchantment";
import { XP_GAIN_PER_RANK } from "helpers/constants/rankConstants";
import loggers from "loggers";
import { getReqExpBetweenLevels } from "../enchantment/compute";
import { consumeCardsToShards } from "./consumeCardsToShards";

export const cards = ({
	context, client, args, options, command 
}: BaseProps) => {
	try {
		const author = options.author;
		const consumeCommand = args[0];
		if (consumeCommand === "consume" || consumeCommand === "cons") {
			args.shift();
			consumeCardsToShards({
				context,
				options,
				args,
				client,
				command
			});
			return;
		}
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
		const reqExp = getReqExpBetweenLevels(baseLevel, levelDiff);
		const { withSameName, withDifferentName } = prepareXpGainObject(reqExp);

		const embed = createEmbed(author, client);
		embed
			.setTitle("Enchantment Consumable Cards Required")
			.addField(
				"CARDS REQUIRED WITH SAME NAME, 3x MULTIPLIER",
				`Between Level ${baseLevel} to ${maxLevel}`
			)
			.setFooter({ text: "Total EXP Gained and Total Cost depends on the cards you consume", });
		embed.addField(
			`Platinum (${3 * XP_GAIN_PER_RANK.platinum} xp per each card)`,
			`${withSameName.platinum} Cards`,
			true
		);
		embed.addField(
			"CARDS REQUIRED WITH DIFFERENT NAMES, NO MULTIPLIER",
			`Between Level ${baseLevel} to ${maxLevel}`
		);
		embed.addField(
			`Platinum (${XP_GAIN_PER_RANK.platinum} xp per each card)`,
			`${withDifferentName.platinum} Cards`,
			true
		);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.consumableCards.cards: ERROR",
			err
		);
		return;
	}
};
