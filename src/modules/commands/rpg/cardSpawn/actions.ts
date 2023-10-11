import { ChannelProp } from "@customTypes";
import { CardSpawnProps } from "@customTypes/cardSpawns";
import {
	delDropChannels,
	updateDropChannels,
} from "api/controllers/CardSpawnsController";
import { createEmbed } from "commons/embeds";
import { Client, GuildBasedChannel } from "discord.js";
import { DEFAULT_ERROR_TITLE } from "helpers/constants/constants";
import loggers from "loggers";

export const removeChannel = async (params: {
  guildChannel: GuildBasedChannel;
  channel: ChannelProp;
  client: Client;
  cardSpawnData?: CardSpawnProps;
}) => {
	try {
		if (!params.cardSpawnData) {
			params.channel?.sendMessage(
				"You have not set up a Card Redirect Channel yet! :no_entry:"
			);
			return;
		}
		const redirectDrops = params.cardSpawnData;
		const index = redirectDrops.channels.findIndex(
			(c) => c === params.guildChannel.id
		);
		if (index >= 0) {
			redirectDrops.channels.splice(index, 1);
			if (redirectDrops.channels.length <= 0) {
				await delDropChannels({ id: redirectDrops.id });
			} else {
				await updateDropChannels(
					{ id: redirectDrops.id },
					{ channels: JSON.stringify(redirectDrops.channels) }
				);
			}
		}
		params.channel?.sendMessage(
			`Channel <#${params.guildChannel.id}> has been removed!`
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.cardSpwan.actions.removeChannel: ERROR",
			err
		);
		return;
	}
};

export const resetChannels = async (params: {
	channel: ChannelProp;
	client: Client;
	cardSpawnData?: CardSpawnProps;
  }) => {
	  try {
		  const embed = createEmbed()
			  .setTitle(DEFAULT_ERROR_TITLE)
			  .setThumbnail(params.client.user?.displayAvatarURL() || "");
		  const dropChannels = params.cardSpawnData;
		  if (!dropChannels) {
			  embed.setDescription("You have not set Card Drop Redirect Channels.");
			  params.channel?.sendMessage(embed);
			  return;
		  }
		  await delDropChannels({ id: dropChannels.id });
		  params.channel?.sendMessage("Successfully reset all redirect channels!");
		  return;
	  } catch (err) {
		  loggers.error(
			  "modules.commands.rpg.cardSpwan.actions.resetChannels: ERROR",
			  err
		  );
		  return;
	  }
};
  
export const viewChannels = async (params: {
  channel: ChannelProp;
  client: Client;
  cardSpawnData?: CardSpawnProps;
}) => {
	try {
		const embed = createEmbed()
			.setTitle(DEFAULT_ERROR_TITLE)
			.setThumbnail(params.client.user?.displayAvatarURL() || "");
		const dropChannels = params.cardSpawnData;
		if (!dropChannels) {
			embed.setDescription("You have not set Card Drop Redirect Channels.");
			params.channel?.sendMessage(embed);
			return;
		}
		embed
			.setTitle("View Card Drops Channels")
			.setDescription(
				`All the Channels registered for card drops are shown below.\n\n${dropChannels.channels
					.map((ch) => `<#${ch}>`)
					.join(" ")}`
			);
		params.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.cardSpwan.actions.viewChannels: ERROR",
			err
		);
		return;
	}
};
