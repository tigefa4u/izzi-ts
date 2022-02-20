import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { SelectMenuCallbackParams } from "@customTypes/selectMenu";
import { TeamProps } from "@customTypes/teams";
import { getAllTeams } from "api/controllers/TeamsController";
import { createEmbed } from "commons/embeds";
import loggers from "loggers";
import {
	prepareAndSendTeamMenuEmbed,
	prepareTeamsForMenu,
	showTeam,
} from "..";

async function handleTeamView(
	params: SelectMenuCallbackParams<{ teams: TeamProps[]; user_id: number }>,
	value?: string
) {
	if (!value || !params.extras?.user_id) return;
	const teams = params.extras?.teams;
	if (!teams) return;
	const selected = teams.filter((t) => t.name === value)[0];
	if (!selected) {
		params.channel?.sendMessage(
			"We could not find the Team you were looking for."
		);
		return;
	}
	const teamDetails = await showTeam({
		user_id: params.extras.user_id,
		name: selected.name,
	});
	if (!teamDetails) {
		params.channel?.sendMessage(`Unable to view __Team ${selected.name}__. Please reset your team.`);
		return;
	}
	const embed = createEmbed(params.author, params.client)
		.setTitle(teamDetails.title)
		.setDescription(teamDetails.desc);

	params.channel?.sendMessage(embed);
	return;
}

export const viewTeam = async ({
	client,
	context,
	author,
	user_id,
}: Omit<BaseProps, "options"> & { author: AuthorProps; user_id: number }) => {
	try {
		const teams = await getAllTeams({ user_id });
		if (!teams) {
			context.channel?.sendMessage(
				"You do not have any teams. " +
          "Use ``team create <name>`` to create one!"
			);
			return;
		}
		const menuOptions = prepareTeamsForMenu(teams);
		const params = {
			channel: context.channel,
			author,
			client,
			extras: {
				teams,
				user_id,
			},
		};
		prepareAndSendTeamMenuEmbed(
			context.channel,
			author,
			client,
			menuOptions,
			params,
			handleTeamView
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.team.actions.viewTeam(): something went wrong",
			err
		);
		return;
	}
};
