import { BaseProps } from "@customTypes/command";
import { updateRPGUser } from "api/controllers/UsersController";
import emoji from "emojis/emoji";
import { parsePremiumUsername } from "helpers";
import { MAX_USER_STATUS_LENGTH } from "helpers/constants";
import loggers from "loggers";

export const updateIzziProfile = async ({ context, options, args }: BaseProps) => {
	try {
		const cmd = args.shift();
		const author = options.author;
		if (cmd && cmd === "status") {
			const status = args.join(" ").trim();
			if (status.length > MAX_USER_STATUS_LENGTH) {
				context.channel?.sendMessage(`Summoner **${author.username}**, your user status must not exceed ` +
				`__${MAX_USER_STATUS_LENGTH}__ characters.`);
				return;
			}
			await updateRPGUser(
				{ user_tag: author.id },
				{ metadata: { status } }
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
			"modules.commands.rpg.profile.updateIzziProfile(): something went wrong",
			err
		);
		return;
	}
};
