import { AuthorProps } from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { SelectMenuCallbackParams } from "@customTypes/selectMenu";
import { TeamProps } from "@customTypes/teams";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { getAllTeams, updateTeam } from "api/controllers/TeamsController";
import { createEmbed } from "commons/embeds";
import { findDuplicateCollectionInTeamsAndUpdate } from "helpers/teams";
import loggers from "loggers";
import { titleCase } from "title-case";
import { reorderObjectKey } from "utility";
import { prepareAndSendTeamMenuEmbed, prepareTeamsForMenu, showTeam } from "..";

async function handleTeamSet(
	params: SelectMenuCallbackParams<{
    team: TeamProps;
    collection: CollectionCardInfoProps;
    user_id: number;
    teams: TeamProps[];
  }>,
	value?: string
) {
	let team = params.extras?.team;
	const collection = params.extras?.collection;
	const userId = params.extras?.user_id;
	if (!value || !userId || !collection || !team) return;
	const teams = await getAllTeams({ user_id: userId });
	if (!teams) return;
	const position = +value;
	if (position > 3 || position < 1) {
		params.channel?.sendMessage(
			"Unable to assign to this position. Please reset your team"
		);
		return;
	}
	const filteredTeams = await findDuplicateCollectionInTeamsAndUpdate(teams, collection.id, team.id);
	const teamsMap = reorderObjectKey(teams, "id");
	if (filteredTeams && filteredTeams.length > 0) {
		filteredTeams.forEach((f) => {
			if (f?.id) {
				teamsMap[f.id] = f;
			}
		});
	}
	if (!teamsMap) {
		params.channel?.sendMessage("Unable to process team");
		throw new Error(`Team not found for id: ${team.id} in teams map: ${JSON.stringify(teamsMap)}`);
	}
	team = teamsMap[team.id];
	if (!team) return;
	team.metadata[position - 1] = {
		collection_id: collection.id,
		position,
	};
	await updateTeam(
		{
			id: team.id,
			user_id: userId,
		},
		{ metadata: JSON.stringify(team.metadata) }
	);

	params.channel?.sendMessage(
		`Successfully assigned __${titleCase(collection.rank)}__ **${titleCase(
			collection.name
		)}** Level ${collection.character_level} to __Position #${position}__`
	);
	return;
}

async function handleTeamView(
	params: SelectMenuCallbackParams<{
    teams: TeamProps[];
    user_id: number;
    collection: CollectionCardInfoProps;
  }>,
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
	const setParams = {
		...params,
		extras: {
			...params.extras,
			team: selected,
		}
	};
	const positionOptions = preparePositionOptions();
	prepareAndSendTeamMenuEmbed(
		params.channel,
		params.author,
		params.client,
		positionOptions,
		setParams,
		handleTeamSet,
		{
			title: `Team ${selected.name}`,
			description: "Select a Position to Assign" 
		}
	);
	return;
}

export const setTeam = async ({
	client,
	context,
	author,
	user_id,
	args,
}: Omit<BaseProps, "options"> & { author: AuthorProps; user_id: number }) => {
	try {
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const collection = await getCardInfoByRowNumber({
			row_number: id,
			user_id,
		});
		if (!collection) return;
		const teams = await getAllTeams({ user_id });
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
				user_id,
				collection: collection[0],
			},
		};
		prepareAndSendTeamMenuEmbed(
			context.channel,
			author,
			client,
			menuOptions,
			params,
			handleTeamView,
		);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.team.actions.setTeam(): something went wrong",
			err
		);
		return;
	}
};

function preparePositionOptions() {
	const menuOptions = [ 1, 2, 3 ].map((i) => ({
		label: `Position ${i}`,
		value: `${i}`
	}));

	return {
		menuOptions,
		extras: { placeholder: "Select a Position" }
	};
}