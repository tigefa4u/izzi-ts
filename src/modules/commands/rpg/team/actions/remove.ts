import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { SelectMenuCallbackParams } from "@customTypes/selectMenu";
import { TeamProps } from "@customTypes/teams";
import { UserProps } from "@customTypes/users";
import { deleteTeam, getAllTeams } from "api/controllers/TeamsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import loggers from "loggers";
import { prepareAndSendTeamMenuEmbed, prepareTeamsForMenu, team } from "..";

async function handleRemoveTeam(
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
	if (selected.id === user.selected_team_id) {
		user.selected_team_id = null;
		updateRPGUser({ user_tag: user.user_tag }, { selected_team_id: user.selected_team_id })
			.then(async () => await deleteTeam({
				id: selected.id,
				user_id: user.id 
			}));
	} else {
		await deleteTeam({
			id: selected.id,
			user_id: user.id 
		});
	}
	params.channel?.sendMessage(`Successfully removed **__Team ${selected.name}__** from your list!`);
	return;
}

export const removeTeam = async ({ context, client, author, user }: Omit<BaseProps, "options"> & {
    author: AuthorProps;
    user: UserProps;
  }) => {
	try {
		const revalidateUser = await getRPGUser({ user_tag: user.user_tag });
		if (!revalidateUser) return;
		user = revalidateUser;
		const teams = await getAllTeams({ user_id: user.id });
		if (!teams || teams.length <= 0) {
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
			handleRemoveTeam
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.team.actions.selectTeam: ERROR",
			err
		);
		return;
	}
};