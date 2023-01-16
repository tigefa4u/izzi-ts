import { ConfirmationInteractionOptions, ConfirmationInteractionParams } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { delDGTeam } from "api/controllers/DungeonsController";
import { updateUserRank } from "api/controllers/UserRanksController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import { DEFAULT_SUCCESS_TITLE, DUNGEON_DEFAULTS } from "helpers/constants";
import loggers from "loggers";
import { confirmationInteraction } from "utility/ButtonInteractions";

const handleRemoveDGTeam = async (
	params: ConfirmationInteractionParams,
	options?: ConfirmationInteractionOptions
) => {
	if (options?.isConfirm) {
		loggers.info("removing DG Team and resetting rank for user: " + params.author.id);
		await Promise.all([
			delDGTeam(params.author.id),
			updateUserRank({ user_tag: params.author.id }, {
				rank: DUNGEON_DEFAULTS.rank,
				rank_id: DUNGEON_DEFAULTS.rank_id,
				r_exp: DUNGEON_DEFAULTS.r_exp,
				exp: DUNGEON_DEFAULTS.exp,
				division: DUNGEON_DEFAULTS.division,
				wins: DUNGEON_DEFAULTS.wins,
				loss: DUNGEON_DEFAULTS.loss
			})
		]);
		const embed = createEmbed(params.author, params.client).setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription("Successfully removed DG Team and your rank has been reset!");

		params.channel?.sendMessage(embed);
		return;
	}
	return true;
};

export const removeDGTeam = async ({ context, options, client }: BaseProps) => {
	try {
		const author = options.author;
		let embed = createEmbed(author, client)
			.setDescription("No content available.")
			.setHideConsoleButtons(true);
		let sentMessage: Message;

		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			{
				channel: context.channel,
				author,
				client,
			},
			handleRemoveDGTeam,
			(_data, opts) => {
				if (_data) {
					embed = createConfirmationEmbed(author, client)
						.setDescription("Are you sure you want to remove your DG Team? " +
                        "Doing so will also reset your DG Rank!");
				}
				if (opts?.isDelete) {
					sentMessage.deleteMessage();
				}
			}
		);

		if (buttons) {
			embed.setButtons(buttons);
		}

		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("dungeon.v2.remove.removeDGTeam: ERROR", err);
		return;
	}
};