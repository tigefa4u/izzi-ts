import { BaseProps } from "@customTypes/command";
import { updateRPGUser } from "api/controllers/UsersController";
import loggers from "loggers";

export const updateIzziProfile = async ({ context, options }: BaseProps) => {
	try {
		const author = options.author;
		await updateRPGUser({ user_tag: author.id }, { username: author.username }, { hydrateCache: true });
		context.channel?.sendMessage(`Successfully updated your izzi profile username to **__${author.username}__**`);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.profile.updateIzziProfile(): something went wrong",
			err
		);
		return;
	}
};