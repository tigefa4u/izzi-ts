import { BaseProps } from "@customTypes/command";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { getMemberPermissions } from "helpers";
import { DEFAULT_SUCCESS_TITLE } from "helpers/constants/constants";
import loggers from "loggers";

export const toggleTourneyMode = async ({
	context,
	client,
	options,
}: BaseProps) => {
	try {
		if (!context.guild?.id) return;
		const author = options.author;
		const isAdmin = await getMemberPermissions(context, options.author.id).then(
			(res) => res?.ADMINISTRATOR
		);
		if (!isAdmin) {
			context.channel?.sendMessage(
				"You are not allowed to execute this command! :x:"
			);
			return;
		}
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const key = "tourney::" + context.guild.id;
		const res = await Cache.get(key);
		const embed = createEmbed(author, client).setTitle(DEFAULT_SUCCESS_TITLE);
		if (res) {
			await Cache.del(key);
			embed.setDescription("Successfully set Tourney Mode: Off");
			context.channel?.sendMessage(embed);
			return;
		}
		await Cache.set(key, JSON.stringify({
			capCharacterMaxLevel: "Card levels are capped at level 70",
			disableGuildStats: "Guild stats are disabled."
		}));
		Cache.expire && (await Cache.expire(key, 60 * 60 * 24 * 30));
		embed.setDescription("Successfully set Tourney Mode: On");
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guildEvents.actions.toggleTourneyMode: ERROR",
			err
		);
		return;
	}
};