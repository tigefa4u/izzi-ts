import { RaidActionProps } from "@customTypes/raids";
import { getRPGUser } from "api/controllers/UsersController";
import loggers from "loggers";
import { validateCurrentRaid } from "./validateRaid";

export const showEnergy = async ({ context, options, client, isEvent }: RaidActionProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const currentRaid = await validateCurrentRaid(user.id, author, client, context.channel);
		if (!currentRaid) return;
		if (!currentRaid.is_start) {
			context.channel?.sendMessage(`The ${isEvent ? "Event" : "Raid"} Challenge has not started!`);
			return;
		}
		const member = currentRaid.lobby_member;
		context.channel?.sendMessage(`${author.username} currently has __${member?.energy || 0}__ energy`);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.actions.showEnergy(): something went wrong", err);
		return;
	}
};