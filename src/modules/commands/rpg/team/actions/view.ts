import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { SelectMenuCallbackParams } from "@customTypes/selectMenu";
import { TeamExtraProps, TeamProps } from "@customTypes/teams";
import { getAllTeams } from "api/controllers/TeamsController";
import { createEmbed } from "commons/embeds";
import loggers from "loggers";
import { prepareAndSendTeamMenuEmbed, prepareTeamsForMenu, showTeam } from "..";

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
		params.channel?.sendMessage(
			`Unable to view __Team ${selected.name}__. Please reset your team.`
		);
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
	args,
	canShowSelectedTeam,
	selectedTeamId,
}: Omit<BaseProps, "options"> & {
  author: AuthorProps;
  user_id: number;
} & TeamExtraProps) => {
	try {
		const teams = await getAllTeams({ user_id });
		if (!teams || teams.length <= 0) {
			context.channel?.sendMessage(
				"You do not have any teams. " +
          "Use ``team create <name>`` to create one!"
			);
			return;
		}
		const params = {
			channel: context.channel,
			author,
			client,
			extras: {
				teams,
				user_id,
			},
		};
		if (teams.length === 1) {
			handleTeamView(params, teams[0].name);
			return;
		}
		if (canShowSelectedTeam && selectedTeamId) {
			const selectedTeam = teams.find((t) => t.id === selectedTeamId);
			if (selectedTeam) {
				handleTeamView(params, selectedTeam.name);
				return;
			}
		}
		const name = args.join(" ");
		if (name !== "") {
			const team = teams.find((t) => t.name.includes(name));
			if (team) {
				handleTeamView(params, team.name);
				return;
			}
		}
		const menuOptions = prepareTeamsForMenu(teams);
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
