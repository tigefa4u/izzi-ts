import { BaseProps } from "@customTypes/command";
import { createUserBlacklist, getUserBlacklist, updateUserBlacklist } from "api/controllers/UserBlacklistsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import emoji from "emojis/emoji";
import { parsePremiumUsername } from "helpers";
import { BANNED_TERMS, MAX_USER_STATUS_LENGTH } from "helpers/constants";
import loggers from "loggers";

export const updateIzziProfile = async ({ context, options, args }: BaseProps) => {
	try {
		const cmd = args.shift();
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (cmd && cmd === "status") {
			const status = context.content.split("status")[1]?.trim() || "";
			if (status.length > MAX_USER_STATUS_LENGTH) {
				context.channel?.sendMessage(`Summoner **${author.username}**, your user status must not exceed ` +
				`__${MAX_USER_STATUS_LENGTH}__ characters.`);
				return;
			}
			if (BANNED_TERMS.includes(status.toLowerCase())) {
				context.channel?.sendMessage(`Summoner **${author.username}**, You have been blacklisted for ` +
				"using a banned term.");
				const blackList = await getUserBlacklist({ user_tag: author.id });
				if (blackList && blackList.length > 0) {
					await updateUserBlacklist({ user_tag: author.id }, {
						reason: "creating inappropriate user profile status",
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
						reason: "creating inappropriate user profile status",
						offense: 1,
						metadata: {}
					});
				}
				return;
			}
			await updateRPGUser(
				{ user_tag: author.id },
				{
					metadata: {
						...user.metadata,
						status
					} 
				}
			);
			context.channel?.sendMessage(`Successfully updated your user status! ${emoji.welldone}`);
			return;
		}
		await updateRPGUser(
			{ user_tag: author.id },
			{ username: parsePremiumUsername(author.username) },
			{ hydrateCache: true }
		);
		context.channel?.sendMessage(
			`Successfully updated your izzi profile username to **__${author.username}__**`
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.profile.updateIzziProfile: ERROR",
			err
		);
		return;
	}
};
