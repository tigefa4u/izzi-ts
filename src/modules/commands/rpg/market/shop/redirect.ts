import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { getMemberPermissions, getMentionedChannel } from "helpers";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";

export const globalMarketRedirect = async ({
	client,
	author,
	args,
	context,
}: Omit<BaseProps, "options"> & { author: AuthorProps }) => {
	try {
		if (!context.guild?.id) return;
		const isAdmin = await getMemberPermissions(context, author.id).then(
			(res) => res?.ADMINISTRATOR
		);
		const embed = createEmbed(author, client)
			.setTitle(DEFAULT_ERROR_TITLE);
		if (!isAdmin) {
			context.channel?.sendMessage(
				"You do not have permissions to execute this command"
			);
			return;
		}
		const channelId = args[0];
		if (!channelId) {
			embed.setDescription("Please provide a valid **__TEXT Channel__**. " +
            "Type ``iz mk rdt remove`` to remove the current channel.");
			context.channel?.sendMessage(embed);
			return;
		}

		const marketRdtKey = "market-rdt::" + context.guild.id;

		if (channelId === "remove") {
			await Cache.del(marketRdtKey);
			embed.setTitle(DEFAULT_SUCCESS_TITLE)
				.setDescription("Successfully removed Global Market notifications channel. " +
                "To setup another channel use ``iz mk rdt <channelID>``");
			context.channel?.sendMessage(embed);
			return;
		}
		const channel = await getMentionedChannel(context, channelId);
		if (!channel || channel.type !== "GUILD_TEXT") {
			embed.setDescription("Please provide a valid **__TEXT Channel__**. " +
            "Type ``iz mk rdt remove`` to remove the current channel.");
			context.channel?.sendMessage(embed);
			return;
		}

		await Cache.set(marketRdtKey, channel.id);
		if (typeof Cache.expire === "function") {
			// Cache will expire after 60 days
			Cache.expire(marketRdtKey, 60 * 60 * 24 * 60);
		}
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription("Successfully add Global Market notifications channel. " +
            "You will now receive logs when a card is posted for sale on the Global Market." +
            "\n\nTo stop receiving logs use ``iz mk rdt remove``.");
		context.channel?.sendMessage(embed);

		channel.sendMessage(`[Global Market Logs] ${author.username} has added Global Market logs to this channel.`);
		return;
	} catch (err) {
		loggers.error("market.shop.globalMarketRedirect: ERROR", err);
		return;
	}
};
