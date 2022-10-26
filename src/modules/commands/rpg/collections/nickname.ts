import { CardMetadataProps } from "@customTypes/cards";
import { BaseProps } from "@customTypes/command";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { resetAllNicknames, updateCollection } from "api/controllers/CollectionsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { DEFAULT_ERROR_TITLE, MAX_CARD_NICKNAME_LENGTH } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { getSortCache } from "../sorting/sortCache";

export const nickname = async ({ context, client, args, options }: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		if (args[0] === "reset") {
			await resetAllNicknames(user.id);
			context.channel?.sendMessage("Successfully reset all character nicknames " + emoji.celebration);
			return;
		}
		const rowid = Number(args.shift());
		if (!rowid || isNaN(rowid) || rowid <= 0) return;
		const sort = await getSortCache(author.id);
		const rowData = await getCardInfoByRowNumber({
			row_number: rowid,
			user_id: user.id,
			user_tag: author.id
		}, sort);
		if (!rowData || !rowData[0]) return;
		const characterinfo = rowData[0];

		const nickname = args.join(" ");
		if (nickname) {
			const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
			if (nickname.length > MAX_CARD_NICKNAME_LENGTH) {
				embed.setDescription(`Summoner **${author.username}**, card nickname ` +
                `must contain letters between 1 and ${MAX_CARD_NICKNAME_LENGTH}`);
				context.channel?.sendMessage(embed);
				return;
			}
			await updateCollection({ id: characterinfo.id }, { metadata: { nickname } });
			context.channel?.sendMessage(`#${rowid} **${titleCase(characterinfo.name)}** ` +
            `will now be called **${titleCase(nickname)}**`);
		} else {
			if (characterinfo.metadata?.nickname) {
				await updateCollection({ id: characterinfo.id }, { metadata: {} });
			}
			context.channel?.sendMessage(`#${rowid} **${titleCase(characterinfo.name)}** ` +
            `will now be called **${titleCase(characterinfo.name)}**`);
		}
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.collections.nickname(): something went wrong", err);
		return;
	}
};