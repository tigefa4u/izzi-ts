import { BaseProps } from "@customTypes/command";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import emoji from "emojis/emoji";
import { randomElementFromArray } from "helpers";
import { HOURLY_MANA_REGEN } from "helpers/constants";
import loggers from "loggers";
import { getCooldown, sendCommandCDResponse, setCooldown } from "modules/cooldowns";

export const hourly = async ({ message, options }: BaseProps) => {
	try {
		const author = options?.author;
		if (!author) return;
		const cooldown = await getCooldown(author.id, "hourly");
		if (cooldown) {
			sendCommandCDResponse(message.channel, cooldown, author.id, "hourly");
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const randomManaRegen = randomElementFromArray<number>(HOURLY_MANA_REGEN);
		if (!randomManaRegen) return;
		user.mana = user.mana + randomManaRegen;
		await updateRPGUser({ user_tag: author.id }, { mana: user.mana });
		const hourInSec = 60 * 60;
		await setCooldown(author.id, "hourly", hourInSec);
		message.channel.sendMessage(`Congratulations ${emoji.celebration}!` + " " +
            `You have received __${randomManaRegen}__ Mana for your hourly bonus`);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.resource.hourly: something went wrong", err);
		return;
	}
};