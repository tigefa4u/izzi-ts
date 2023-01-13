import { BaseProps } from "@customTypes/command";
import { getDGTeam, updateDGTeam, createDGTeam as create } from "api/controllers/DungeonsController";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";

export const createDGTeam = async ({ args, client, options, context }: BaseProps) => {
	try {
		const author = options.author;
		const name = args.join(" ") || "";
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE)
			.setFooter({
				iconURL: author.displayAvatarURL(),
				text: "Use 'dg set <#ID> <position #>' to set a dungeon team"
			});
		if (name.length < 3 || name.length > 20) {
			embed.setDescription(`Summoner **${author.username}**, Team name must be between 3 and 20 characters`);
			context.channel?.sendMessage(embed);
			return;
		}
		const dgTeam = await getDGTeam(author.id);
		if (dgTeam) {
			loggers.info(`dungeon.v2.create.createDGTeam: existing team found: ${JSON.stringify(dgTeam)}`);
			loggers.info("dungeon.v2.create.createDGTeam: updating existing team name to: " + name);
			await updateDGTeam(author.id, {
				team: {
					...dgTeam.team,
					name
				}
			});
			embed.setTitle(DEFAULT_SUCCESS_TITLE)
				.setDescription(`Successfully updated DG Team name __${dgTeam.team.name}__ to **__${name}__**`);

			context.channel?.sendMessage(embed);
			return;
		}
		await create({
			team: {
				name,
				metadata: [ 1, 2, 3 ].map((n) => ({
					collection_id: null,
					position: n
				})),
			},
			user_tag: author.id,
			username: author.username,
			metadata: { isValid: false }
		});
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Successfully created DG Team **__${name}__**`);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("dungeon.v2.create.createDGTeam: ERROR", err);
		return;
	}
};