import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { UserUpdateProps } from "@customTypes/users";
import { getUserBan } from "api/controllers/BansController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import emoji from "emojis/emoji";
import { DEFAULT_ERROR_TITLE } from "helpers/constants/constants";
import { isEmptyObject } from "utility";

export const checkUserBanned = async (
	context: BaseProps["context"],
	client: Client,
	author: AuthorProps,
	command: string
) => {
	const user = await getRPGUser({ user_tag: author.id }, {
		ignoreBannedUser: true,
		cached: false 
	});

	// After discord made the weird decission to make the username weird
	// use the username that is stored in izzi
 
	const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
	if (command !== "start" && !user) {
		embed.setDescription(
			"You have not started your journey yet! " +
        "Use ``start`` command to start your journey in the Xenverse!"
		);
		context.channel?.sendMessage(embed);
		return;
	}
	if (user?.is_banned) {
		embed.setTitle("You have been Banned :no_entry:");
		
		const userBan = await getUserBan({ user_tag: author.id });
		const banReason = userBan?.ban_reason || "You have been banned";
		const banLength = userBan?.ban_length || 9999;
		embed.setDescription(`**Ban Reason:**\n${banReason}\n**Ban Length:**\n${banLength}`);
		context.channel?.sendMessage(embed);
		return;
	}
	const updateObj = {} as UserUpdateProps;
	if (user && !user.is_active) {
		context.channel?.sendMessage("Welcome back! We have set your account status to active");
		updateObj.is_active = true;
	}
	if (user?.is_premium) {
		author.username = `${emoji.premium} ${author.username}`;
	}

	/**
	 * log user last active at after 24hours
	 */
	const key = "activity-log:" + author.id;
	const activityLogged = await Cache.get(key);
	if (!activityLogged && user) {
		await Cache.set(key, "1");
		Cache.expire && (await Cache.expire(key, 60 * 60 * 24));
		updateObj.last_active_at = new Date();
	}
	if (!isEmptyObject(updateObj) && user) {
		await updateRPGUser({ user_tag: user.user_tag }, updateObj);
	}
	return true;
};
