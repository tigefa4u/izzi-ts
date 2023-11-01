import { FilterProps } from "@customTypes";
import { CardMetadataProps } from "@customTypes/cards";
import { BaseProps } from "@customTypes/command";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { resetAllNicknames, updateCollection } from "api/controllers/CollectionsController";
import { updateDzInv } from "api/controllers/DarkZoneInventoryController";
import { createUserBlacklist, getUserBlacklist, updateUserBlacklist } from "api/controllers/UserBlacklistsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { BANNED_TERMS, DEFAULT_ERROR_TITLE, MAX_CARD_NICKNAME_LENGTH } from "helpers/constants/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { fetchParamsFromArgs } from "utility/forParams";
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
		// DARK ZONE FILTER
		// UGLY CODE
		// const params = fetchParamsFromArgs<FilterProps>(args);
		let isDarkZone = false;
		const idx = args.findIndex((a) => a === "-dz");
		if (idx >= 0) {
			args.splice(idx, 1);
			isDarkZone = true;
		}

		const sort = await getSortCache(author.id);
		const rowData = await getCardInfoByRowNumber({
			row_number: rowid,
			user_id: user.id,
			user_tag: author.id,
			isDarkZone: isDarkZone
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
			/**
			 * Do not allow nicknames to be pingable roles
			 */
			if (nickname.toLowerCase().includes("<@&")) {
				embed.setDescription(`Summoner **${author.username}**, ` +
				"You cannot use a role in card nicknames.");
				context.channel?.sendMessage(embed);
				return;
			}
			if (BANNED_TERMS.includes(nickname.toLowerCase())) {
				context.channel?.sendMessage(`Summoner **${author.username}**, You have been blacklisted for ` +
				"using a banned term.");
				const blackList = await getUserBlacklist({ user_tag: author.id });
				if (blackList && blackList.length > 0) {
					await updateUserBlacklist({ user_tag: author.id }, {
						reason: "creating inappropriate card nicknames",
						offense: blackList[0].offense + 1,
						metadata: {
							pastOffenses: [
								...(blackList[0].metadata.pastOffenses || []),
								blackList[0].reason
							]
						}
					});
				} else {
					await createUserBlacklist({
						user_tag: author.id,
						username: author.username,
						reason: "creating inappropriate card nicknames",
						offense: 1,
						metadata: {}
					});
				}
				return;
			}
			if (isDarkZone) {
				await updateDzInv({
					id: characterinfo.id,
					user_tag: author.id 
				}, { metadata: { nickname } });
			} else {
				await updateCollection({ id: characterinfo.id }, { metadata: { nickname } });
			}
			context.channel?.sendMessage(`#${rowid} **${titleCase(characterinfo.name)}** ` +
            `will now be called **${titleCase(nickname)}**`);
		} else {
			if (characterinfo.metadata?.nickname) {
				if (isDarkZone) {
					await updateCollection({ id: characterinfo.id }, { metadata: {} });
				} else {
					await updateCollection({ id: characterinfo.id }, { metadata: {} });
				}
			}
			context.channel?.sendMessage(`#${rowid} **${titleCase(characterinfo.name)}** ` +
            `will now be called **${titleCase(characterinfo.name)}**`);
		}
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.collections.nickname: ERROR", err);
		return;
	}
};