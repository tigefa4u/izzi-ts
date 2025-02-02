import { ChannelProp } from "@customTypes";
import { getCardDropChannels } from "api/controllers/CardSpawnsController";
import { AnyChannel, Client, Guild } from "discord.js";
import { randomElementFromArray } from "helpers";
import loggers from "loggers";

type T = {
    client: Client;
    guild: Guild;
    channel: ChannelProp;
}
export const verifyDropChannels = async ({ client, guild, channel }: T) => {
	if (!guild) return;
	try {
		const dropChannels = await getCardDropChannels({ guild_id: guild.id });
		let permissions;
		let dropChannel: AnyChannel | ChannelProp | null = channel;
		if (dropChannels) {
			const chId = randomElementFromArray(dropChannels.channels);
			if (chId) {
				const ch = client.channels.cache.get(chId);
				if (ch) {
					dropChannel = ch;
				}
			}
		}
		if (dropChannel) {
			permissions = guild.me?.permissionsIn(dropChannel.id).serialize();
			if (!permissions?.VIEW_CHANNEL || !permissions.SEND_MESSAGES) {
				return;
			}
		}
		return dropChannel;
	} catch (err) {
		loggers.error("modules.collectables.channels.verifyDropChannels: ERROR", err);
		return;
	}
};