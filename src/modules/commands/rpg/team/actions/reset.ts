import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { SelectMenuCallbackParams } from "@customTypes/selectMenu";
import { TeamProps } from "@customTypes/teams";
import { UserProps } from "@customTypes/users";
import { getAllTeams, updateTeam } from "api/controllers/TeamsController";
import { updateRPGUser } from "api/controllers/UsersController";
import loggers from "loggers";
import { prepareAndSendTeamMenuEmbed, prepareTeamsForMenu } from "..";

async function handleTeamReset(
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
		await updateRPGUser({ user_tag: user.user_tag }, { selected_team_id: null });
	}
	selected.metadata = [ 1, 2, 3 ].map((i) => ({
		collection_id: null,
		position: i,
		itemPosition: i,
		item_id: null,
		itemName: null
	}));
	await updateTeam({
		id: selected.id,
		user_id: user.id 
	}, { metadata: JSON.stringify(selected.metadata) });
	params.channel?.sendMessage(`Successfully reset **__Team ${selected.name}__**`);
	return;
}

export const resetTeam = async ({
	context, client, author, user, args 
}: Omit<BaseProps, "options"> & {
  author: AuthorProps;
  user: UserProps;
}) => {
	try {
		const teams = await getAllTeams({ user_id: user.id });
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
				user,
			},
		};
		if (teams.length === 1) {
			handleTeamReset(params, teams[0].name);
			return;
		}
		const name = args.join(" ");
		if (name || name !== "") {
			const team = teams.find((t) => t.name.includes(name));
			if (team) {
				handleTeamReset(params, team.name);
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
			handleTeamReset
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.team.actions.resetTeam(): something went wrong",
			err
		);
		return;
	}
};
