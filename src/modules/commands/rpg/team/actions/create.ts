import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getAllTeams, createTeam as create } from "api/controllers/TeamsController";
import { createUserBlacklist, getUserBlacklist, updateUserBlacklist } from "api/controllers/UserBlacklistsController";
import { BANNED_TERMS, MAX_TEAMS_ALLOWED } from "helpers/constants";
import loggers from "loggers";

export const createTeam = async ({
	context,
	args,
	user_id,
	author
}: Omit<BaseProps, "options"> & { author: AuthorProps; user_id: number }) => {
	try {
		const name = args.join(" ");
		if (name === "") return;
		if (BANNED_TERMS.includes(name.toLowerCase())) {
			context.channel?.sendMessage(`Summoner **${author.username}**, You have been blacklisted for ` +
			"using a banned term.");
			const blackList = await getUserBlacklist({ user_tag: author.id });
			console.log({ blackList });
			if (blackList && blackList.length > 0) {
				await updateUserBlacklist({ user_tag: author.id }, {
					reason: "creating inappropriate team names",
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
					reason: "creating inappropriate team names",
					offense: 1,
					metadata: {}
				});
			}
			return;
		}
		if (name.length > 10) {
			context.channel?.sendMessage("Please enter a team name between 1 and 10");
			return;
		}
		const teams = await getAllTeams({ user_id });
		if (teams) {
			const filtered = teams.filter((t) => t.name === name);
			if (filtered.length > 0) {
				context.channel?.sendMessage(
					"A Team with this name already exists! " +
            "use ``team view`` to view all your teams."
				);
				return;
			}
			if (teams.length >= MAX_TEAMS_ALLOWED) {
				context.channel?.sendMessage(
					`You cannot create more than __[${teams.length} / ${MAX_TEAMS_ALLOWED}]__ Teams!`
				);
				return;
			}
		}
		await create({
			name,
			user_id,
			metadata: JSON.stringify([ 1, 2, 3 ].map((position) => ({
				position,
				collection_id: null
			})))
		});
		context.channel?.sendMessage(`Successfully created **__Team ${name}__**`);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.team.actions.createTeam: ERROR",
			err
		);
		return;
	}
};
