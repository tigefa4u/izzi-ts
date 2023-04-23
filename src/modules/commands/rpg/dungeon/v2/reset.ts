import { ConfirmationInteractionOptions, ConfirmationInteractionParams } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { DungeonProps } from "@customTypes/dungeon";
import { getDGTeam, updateDGTeam } from "api/controllers/DungeonsController";
import { updateUserRank } from "api/controllers/UserRanksController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import { DEFAULT_SUCCESS_TITLE, DUNGEON_DEFAULTS } from "helpers/constants";
import loggers from "loggers";
import { confirmationInteraction } from "utility/ButtonInteractions";

const confirmAndResetDgTeam = async (
	params: ConfirmationInteractionParams<{ dgTeam: DungeonProps; }>,
	options?: ConfirmationInteractionOptions
) => {
	const { channel, client, author, extras } = params;
	if (!extras?.dgTeam) return;
	if (options?.isConfirm) {
		const dgTeam = extras.dgTeam;
		dgTeam.team.metadata = [ 1, 2, 3 ].map((n) => ({
			collection_id: null,
			position: n,
			itemName: null,
			item_id: null,
			itemPosition: n
		}));
		await Promise.all([
			updateDGTeam(author.id, {
				team: dgTeam.team,
				metadata: {
					...dgTeam.metadata,
					isValid: false
				} 
			}),
			updateUserRank({ user_tag: author.id }, {
				r_exp: DUNGEON_DEFAULTS.r_exp,
				exp: DUNGEON_DEFAULTS.exp,
				rank: DUNGEON_DEFAULTS.rank,
				rank_id: DUNGEON_DEFAULTS.rank_id,
				division: DUNGEON_DEFAULTS.division
			})
		]);
		const embed = createEmbed(author, client).setTitle("DG Team Reset / Removed")
			.setDescription("You have successfully reset / removed your DG Team." +
			" Your Rank and exp has also been reset to **Duke Division 1**.");
		channel?.sendMessage(embed);
		return;
	}
	return true;
};

export const resetDGTeam = async ({ options, context, client }: BaseProps) => {
	try {
		const author = options.author;
		const dgTeam = await getDGTeam(author.id);
		if (dgTeam) {
			let embed = createEmbed(author, client).setDescription("Nothing happened");
			let sentMessage: Message;
			const buttons = await confirmationInteraction(
				context.channel,
				author.id,
				{
					channel: context.channel,
					client,
					author,
					extras: { dgTeam }
				},
				confirmAndResetDgTeam,
				(data, opts) => {
					if (data) {
						embed = createConfirmationEmbed(author, client)
							.setDescription("Are you sure you want to reset your DG Team?" +
							"\n**This action will also reset your DG Rank to Duke Division 1**")
							.setHideConsoleButtons(true);
					}
					if (opts?.isDelete) {
						sentMessage.deleteMessage();
					}
				}
			);
			if (!buttons) return;
			embed.setButtons(buttons);
			const msg = await context.channel?.sendMessage(embed);
			if (msg) {
				sentMessage = msg;
			}
		}
		return;
	} catch (err) {
		loggers.error("dungeon.v2.reset.resetDGTeam: ERROR", err);
		return;
	}
};