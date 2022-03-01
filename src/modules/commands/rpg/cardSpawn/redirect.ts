import { BaseProps } from "@customTypes/command";
import {
	createDropChannels,
	getCardDropChannels,
	updateDropChannels,
} from "api/controllers/CardSpawnsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { getMentionedChannel } from "helpers";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	RDT_ADMIN_PERMISSION,
} from "helpers/constants";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { removeChannel, viewChannels } from "./actions";
import { subcommands } from "./subcommands";

export const redirect = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		if (!context.guild?.id) return;
		const author = options.author;
		const isAdmin = false;
		const embed = createEmbed(author, client)
			.setTitle(DEFAULT_ERROR_TITLE);
		if (!isAdmin) {
			context.channel?.sendMessage(
				"You do not have permissions to execute this command"
			);
			return;
		}
		const subcommand = filterSubCommands(args[0], subcommands);
		const dropChannels = await getCardDropChannels({ guild_id: context.guild.id, });

		const params = {
			client,
			channel: context.channel,
			cardSpawnData: dropChannels,
		};
		if (subcommand === "view") {
			viewChannels(params);
			return;
		}

		const channelId = args[subcommand ? 1 : 0].substring(2).substring(0, 18);
		if (!channelId) return;
		const channel = await getMentionedChannel(context, channelId);
		if (!channel) return;
		if (subcommand === "remove") {
			removeChannel({
				...params,
				guildChannel: channel,
			});
			return;
		}

		if (dropChannels) {
			const duplicateChannel = dropChannels.channels.includes(channel.id);
			if (duplicateChannel) {
				embed.setDescription(
					"This channel has already been registered. " +
            "Use ``redirect view`` to view all Card Drop Redirect channels."
				);
				context.channel?.sendMessage(embed);
				return;
			}
			dropChannels.channels.push(channel.id);
			if (dropChannels.channels.length > 3) {
				context.channel?.sendMessage(
					`Summoner **${author.username}**, ` +
            "If you wish to use more than 3 channels, " +
            "we recommend using the default settings"
				);
				return;
			}
			await updateDropChannels(
				{ id: dropChannels.id },
				{ channels: JSON.stringify(dropChannels.channels) }
			);
		} else {
			const data = {
				guild_id: context.guild.id,
				channels: JSON.stringify([ channel.id ]),
			};
			await createDropChannels(data);
		}
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Successfully set Card Drop Redirects to the channel:\n<#${channel.id}>`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.cardSpawn.redirect.redirect(): something went wrong",
			err
		);
		return;
	}
};
