import { BaseProps } from "@customTypes/command";
import { getTotalPlayers } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { OWNER_DISCORDID } from "environment";
import { numericWithComma, parsePremiumUsername } from "helpers";
import loggers from "loggers";

export const status = async ({ context, client, options }: BaseProps) => {
	try {
		const author = options.author;
		if (
			!OWNER_DISCORDID ||
      (author.id !== OWNER_DISCORDID && author.id !== "476049957904711682")
		)
			return;
		const embed = createEmbed(author, client);
		const playerCount = await getTotalPlayers();
		if (!playerCount) return;
		const totalPlayers =
      playerCount.find((p) => p.status === "total")?.count || "0";
		const activePlayers =
      playerCount.find((p) => p.status === "active")?.count || "0";

		const shardStatus = await client.shard?.broadcastEval((cl) => [
			cl.shard?.ids,
			cl.ws.ping,
			cl.ws.status,
			cl.guilds.cache.size,
		]);
		const owner = await client.users.fetch(OWNER_DISCORDID);
		owner.username = parsePremiumUsername(owner.username);
		embed
			.setTitle("izzi Stats")
			.addFields([
				{
					name: ":ping_pong: ws ping",
					value: `${client.ws.ping}ms`,
					inline: true,
				},
				{
					name: ":globe_with_meridians: Servers",
					value: `serving ${await client.shard
						?.fetchClientValues("guilds.cache.size")
						.then((res: unknown[]) =>
							res.reduce((a: any, b: any) => a + b, 0)
						)} servers`,
					inline: true,
				},
				{
					name: ":busts_in_silhouette: Izzi Players",
					value: numericWithComma(Number(totalPlayers || 0)),
					inline: true,
				},
				{
					name: "Active Players",
					value: numericWithComma(Number(activePlayers || 0)),
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
				},
			])
			.setDescription(
				`\`\`\`${shardStatus
					?.map((s) => `Shard ID: ${s[0]} ws: ${s[1]} status: ${s[2]} guild count: ${s[3]}`)
					.join("\n")}\`\`\``
			)
			.setFooter({ text: `developed by: ${owner.username}#${owner.discriminator}`, });
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.basic.botStatus.status: ERROR", err);
		return;
	}
};
