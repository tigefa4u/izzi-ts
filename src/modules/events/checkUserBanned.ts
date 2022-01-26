import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getUserBan } from "api/controllers/BansController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";

export const checkUserBanned = async (
	context: BaseProps["context"],
	client: Client,
	author: AuthorProps,
	command: string
) => {
	const user = await getRPGUser({ user_tag: author.id });
	const embed = createEmbed(author, client).setTitle("You have been Banned :no_entry:");
	if (command !== "start" && !user) {
		embed.setDescription(
			"You have not started your journey yet! " +
        "Use ``start`` command to start your journey in the Xenverse!"
		);
		context.channel?.sendMessage(embed);
		return;
	}
	if (user?.is_banned) {
		const userBan = await getUserBan({ user_tag: author.id });
		const banReason = userBan?.ban_reason || "You have been banned";
		const banLength = userBan?.ban_length || 9999;
		embed.setDescription(`**Ban Reason:**\n${banReason}\n**Ban Length:**\n${banLength}`);
		context.channel?.sendMessage(embed);
		return;
	}
	return true;
};
