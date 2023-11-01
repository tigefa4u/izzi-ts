import { DzFuncProps } from "@customTypes/darkZone";
import { getDarkZoneProfile } from "api/controllers/DarkZoneController";
import { tableName } from "api/models/DarkZoneProfile";
import { startTransaction } from "api/models/Users";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { getIdFromMentionedString, numericWithComma } from "helpers";
import { DEFAULT_ERROR_TITLE } from "helpers/constants/constants";
import { MAX_FRAGMENT_TRANSFER, MIN_LEVEL_FOR_DZ_TRADE } from "helpers/constants/darkZone";
import loggers from "loggers";

export const giveFragments = async ({
	options, args, client, context, dzUser 
}: DzFuncProps) => {
	try {
		const { author } = options;
		const mentionId = getIdFromMentionedString(args.shift());
		if (!mentionId || mentionId === author.id) {
			context.channel?.sendMessage("You cannot give yourself fragments.");
			return;
		}
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		const amount = parseInt(args.shift() || "0");
		if (isNaN(amount) || amount < 1 || amount > MAX_FRAGMENT_TRANSFER) {
			embed.setDescription(
				`Please enter valid amount between **1 and ${numericWithComma(MAX_FRAGMENT_TRANSFER)}**.`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (dzUser.fragments < amount) {
			embed.setDescription(`You do not have sufficient Fragments ${emoji.fragments} to transfer.`);
			context.channel?.sendMessage(embed);
			return;
		}
		if (dzUser.level < MIN_LEVEL_FOR_DZ_TRADE) {
			embed.setDescription(`Summoner **${author.username}**, You must ` +
            `be atleast Dark Zone level __${MIN_LEVEL_FOR_DZ_TRADE}__ to ` +
            `give and receive Fragments ${emoji.fragments}.`);
			context.channel?.sendMessage(embed);
			return;
		}

		const mentionedUser = await getDarkZoneProfile({ user_tag: mentionId });
		if (!mentionedUser) {
			embed.setDescription(
				"The user you are looking for has not started their journey in the Dark Zone."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (mentionedUser.level < MIN_LEVEL_FOR_DZ_TRADE) {
			embed.setDescription(`Summoner **${mentionedUser.metadata?.username || ""}** must ` +
            `be atleast Dark Zone level __${MIN_LEVEL_FOR_DZ_TRADE}__ to ` +
            `give and receive Fragments ${emoji.fragments}.`);
			context.channel?.sendMessage(embed);
			return;
		}	
		await startTransaction(async (trx) => {
			try {
				loggers.info("giveFragments: transaction started", {
					amount,
					mentionId,
					id: author.id
				});
				const updatedObj = await trx(tableName).where({ user_tag: dzUser.user_tag })
					.where("fragments", ">=", amount)
					.where("level", ">=", MIN_LEVEL_FOR_DZ_TRADE)
					.update({ fragments: trx.raw("fragments - ??", [ amount ]) })
					.returning("id");

				if (!updatedObj || updatedObj.length <= 0) {
					throw new Error("Unable to update profile. Insufficient funds. " + dzUser.user_tag);
				}
				const updatedUser = await trx(tableName).where({ user_tag: mentionId })
					.where("level", ">=", MIN_LEVEL_FOR_DZ_TRADE)
					.update({ fragments: trx.raw("fragments + ??", [ amount ]) })
					.returning("id");

				if (!updatedUser) {
					throw new Error("Unable to update receiving user. " + mentionId);
				}
			} catch (err) {
				loggers.error("giveFragments: transaction failed", err);
				embed.setDescription(
					`You do not have sufficient Fragments ${emoji.fragments} to transfer.` 
				);
				context.channel?.sendMessage(embed);
				return;
			}
		});

		context.channel?.sendMessage(`Successfully transferred ${numericWithComma(amount)} ` +
        `Fragments ${emoji.fragments} to **${mentionedUser.metadata?.username}**`);
		return;
	} catch (err) {
		loggers.error("actions.giveFragments: ERROR", err);
		return;
	}
};