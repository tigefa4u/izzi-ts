import { BaseProps } from "@customTypes/command";
import { getDGTeam, updateDGTeam, createDGTeam as create } from "api/controllers/DungeonsController";
import { createUserBlacklist, getUserBlacklist, updateUserBlacklist } from "api/controllers/UserBlacklistsController";
import { createEmbed } from "commons/embeds";
import { BANNED_TERMS, DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants/constants";
import loggers from "loggers";

export const createDGTeam = async ({ args, client, options, context }: BaseProps) => {
	try {
		const author = options.author;
		let name = args.join(" ") || "";
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE)
			.setFooter({
				iconURL: author.displayAvatarURL(),
				text: "Use 'dg set <#ID> <position #>' to set a dungeon team"
			});

		const blackList = await getUserBlacklist({ user_tag: author.id });
		if (blackList && blackList.length > 0) {
			name = `${author.username} dg team`;
			const warningEmbed = createEmbed(author, client).setTitle("Warning :warning:")
				.setDescription(`Summoner **${author.username}**, we have set your DG Team name to **__${name}__**` +
                " because you have been blacklisted for using banned terms in team names.");

			context.channel?.sendMessage(warningEmbed);
		}

		if (name.length < 3 || name.length > 20) {
			embed.setDescription(`Summoner **${author.username}**, Team name must be between 3 and 20 characters`);
			context.channel?.sendMessage(embed);
			return;
		}
		if (BANNED_TERMS.includes(name.toLowerCase())) {
			context.channel?.sendMessage(`Summoner **${author.username}**, You have been blacklisted for ` +
			"using a banned term.");
			if (blackList && blackList.length > 0) {
				await updateUserBlacklist({ user_tag: author.id }, {
					reason: "creating inappropriate dg team names",
					offense: blackList[0].offense + 1,
					metadata: {
						pastOffenses: [
							...(blackList[0].metadata.pastOffenses || []),
							blackList[0].reason
						]
					}
				});
			} else {
				await createUserBlacklist({
					user_tag: author.id,
					username: author.username,
					reason: "creating inappropriate dg team names",
					offense: 1,
					metadata: {}
				});
			}
			return;
		}
		const dgTeam = await getDGTeam(author.id);
		if (dgTeam) {
			loggers.info("dungeon.v2.create.createDGTeam: existing team found: ", dgTeam);
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
					position: n,
					itemName: null,
					item_id: null,
					itemPosition: n
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