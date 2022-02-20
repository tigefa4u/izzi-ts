import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { SelectMenuCallbackParams } from "@customTypes/selectMenu";
import { TeamProps } from "@customTypes/teams";
import { UserProps } from "@customTypes/users";
import { getAllTeams } from "api/controllers/TeamsController";
import { updateRPGUser } from "api/controllers/UsersController";
import loggers from "loggers";
import { prepareAndSendTeamMenuEmbed, prepareTeamsForMenu } from "..";

async function handleTeamSelect(
	params: SelectMenuCallbackParams<{ teams: TeamProps[]; user: UserProps; }>,
	value?: string
) {
	const teams = params.extras?.teams;
	const user = params.extras?.user;
	if (!teams || !user || !value) return;
	const selected = teams.filter((t) => t.name === value)[0];
	if (!selected) {
		params.channel?.sendMessage(
			"We could not find the Team you were looking for."
		);
		return;
	}
	user.selected_team_id = selected.id;
	await updateRPGUser({ user_tag: user.user_tag }, { selected_team_id: user.selected_team_id });
	params.channel?.sendMessage(`Successfully selected **__Team ${selected.name}__** to fight alongside you!`);
	return;
}

export const selectTeam = async ({ context, client, author, user }: Omit<BaseProps, "options"> & {
  author: AuthorProps;
  user: UserProps;
}) => {
	try {
		const teams = await getAllTeams({ user_id: user.id });
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
				user,
			},
		};
		prepareAndSendTeamMenuEmbed(
			context.channel,
			author,
			client,
			menuOptions,
			params,
			handleTeamSelect
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.team.actions.selectTeam(): something went wrong",
			err
		);
		return;
	}
};
