import { BaseProps } from "@customTypes/command";
import { getTotalPlayers } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { OWNER_DISCORDID } from "environment";
import loggers from "loggers";

export const status = async ({ context, client, options }: BaseProps) => {
	try {
		if (!OWNER_DISCORDID) return;
		const author = options?.author;
		if (!author) return;
		const embed = createEmbed();
		const totalPlayers = await getTotalPlayers();
		const activePlayers = await getTotalPlayers({ is_active: true });
		const owner = await client.users.fetch(OWNER_DISCORDID);
		embed
			.setTitle("izzi Stats")
			.setAuthor({
				name: author.username,
				iconURL: author.displayAvatarURL(),
			})
			.setThumbnail(client.user?.displayAvatarURL() || "")
			.addFields([
				{
					name: ":ping_pong: ws ping",
					value: `${client.ws.ping}ms`,
					inline: true,
				},
				{
					name: ":globe_with_meridians: Servers",
					value: `serving ${await client.shard?.fetchClientValues("guilds.cache.size")
						.then((res: unknown[]) => res.reduce((a: any, b: any) => a + b, 0))} servers`,
					inline: true,
				},
				{
					name: ":busts_in_silhouette: Izzi Players",
					value: `${totalPlayers || 0}`,
					inline: true,
				},
				{
					name: "Active Players",
					value: `${activePlayers || 0}`,
					inline: true,
				},
				{
					name: "Developed with",
					value: `Discord.js ${emoji.djs}`,
					inline: true,
				},
				{
					name: "Created At",
					value: new Date(client.user?.createdAt || Date.now()).toDateString(),
					inline: true,
				}
			])
			.setFooter({ text: `developed by: ${owner.username}#${owner.discriminator}` });
		context.channel.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.basic.botStatus.status(): something went wrong",
			err
		);
		return;
	}
};
