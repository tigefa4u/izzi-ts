import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getAllTeams, createTeam as create } from "api/controllers/TeamsController";
import { MAX_TEAMS_ALLOWED } from "helpers/constants";
import loggers from "loggers";

export const createTeam = async ({
	context,
	args,
	user_id,
}: Omit<BaseProps, "options"> & { author: AuthorProps; user_id: number }) => {
	try {
		const name = args.join(" ");
		if (name === "") return;
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
		context.channel?.sendMessage(`Successfully create **__Team ${name}__**`);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.team.actions.createTeam: ERROR",
			err
		);
		return;
	}
};
