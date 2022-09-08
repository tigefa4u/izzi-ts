import { AuthorProps, ChannelProp, OverallStatsProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { SelectMenuOptions } from "@customTypes/selectMenu";
import { TeamProps } from "@customTypes/teams";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import { getAllTeams } from "api/controllers/TeamsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Client, MessageSelectOptionData } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { filterSubCommands } from "helpers/subcommands";
import { prepareTotalOverallStats } from "helpers/teams";
import loggers from "loggers";
import { titleCase } from "title-case";
import { selectionInteraction } from "utility/SelectMenuInteractions";
import { teamBattle } from "./actions/battle";
import { createTeam } from "./actions/create";
import { equipTeamItem } from "./actions/equip";
import { removeTeam } from "./actions/remove";
import { resetTeam } from "./actions/reset";
import { selectTeam } from "./actions/select";
import { setTeam } from "./actions/set";
import { viewTeam } from "./actions/view";
import { subcommands } from "./subcommands";

export const team = async ({ client, context, options, args }: BaseProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const cmd = args.shift();
		const subcommand = filterSubCommands(cmd || "view", subcommands);
		const params = {
			context,
			author,
			args,
			client,
			user_id: user.id,
			user,
			canShowSelectedTeam: args.length <= 0 ? true : false,
			selectedTeamId: user.selected_team_id
		};
		if (subcommand === "create") {
			createTeam(params);
		} else if (subcommand === "view") {
			if (cmd === "view") {
				params.canShowSelectedTeam = false;
			}
			viewTeam(params);
		} else if (subcommand === "select") {
			selectTeam(params);
		} else if (subcommand === "remove") {
			removeTeam(params);
		} else if (subcommand === "set") {
			setTeam(params);
		} else if (subcommand === "battle") {
			teamBattle(params);
		} else if (subcommand === "reset") {
			resetTeam(params);
		} else if (subcommand === "equip") {
			equipTeamItem(params);
		}
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.team(): something went wrong", err);
		return;
	}
};

export function prepareTeamsForMenu(teams: TeamProps[]): SelectMenuOptions {
	const menuOptions: MessageSelectOptionData[] = teams.map((t) => ({
		label: t.name,
		value: t.name,
	}));

	return {
		menuOptions,
		extras: { placeholder: "Select a Team" },
	};
}

export async function prepareAndSendTeamMenuEmbed<P>(
	channel: ChannelProp,
	author: AuthorProps,
	client: Client,
	options: SelectMenuOptions,
	params: P,
	callback: (params: P, value: string) => void,
	extras?: {
        title: string;
        description: string;
    }
) {
	const embed = createEmbed(author, client)
		.setTitle(extras?.title || `${author.username}'s Teams`)
		.setDescription(extras?.description || "A list of all your Teams are shown in the Select Menu");
	
	const selectMenu = await selectionInteraction(
		channel,
		author.id,
		options,
		params,
		callback
	);

	if (selectMenu) {
		embed.setButtons(selectMenu);
	}

	channel?.sendMessage(embed);
	return;
}

export async function showTeam({
	user_id,
	name,
}: {
  name: string;
  user_id: number;
}) {
	const result = await getAllTeams({
		user_id,
		name,
	});
	if (!result) return;
	const team = result[0];
	const ids = team.metadata
		.map((m) => Number((m || {}).collection_id))
		.filter(Boolean);

	const teamPosition = team.metadata.filter(Boolean).sort((a) => a.position);
	let totalOverallStats;
	if (ids.length > 0) {
		const collections = await getCollectionById({
			ids,
			user_id,
		});
		if (!collections) return;
		totalOverallStats = await prepareTotalOverallStats({
			collections,
			isBattle: false 
		});
	}

	if (!totalOverallStats) {
		const desc = prepareDefaultTeamDescription();
		return {
			title: `Team ${name}`,
			desc
		};
	}
	const {
		collections,
		totalOverallStats: totalTeamStats,
		totalPowerLevel: totalTeamPowerLevel,
	} = totalOverallStats;
	const desc = `The Positions of the assigned cards are listed below.\n\n${teamPosition.sort((a, b) => {
		return a.position > b.position ? 1 : -1;
	})
		.map((item) => {
			const card = collections.filter((c) => c.id === item.collection_id)[0];
			if (!card) {
				item.collection_id = null;
			}
			return `__Position #${item.position}__\n${
				item.collection_id
					? `**${titleCase(card.metadata?.nickname || card.name)} ${emojiMap(card.type)} ${emojiMap(
						card.itemname || (item.item_id && item.itemName ? item.itemName : "") || ""
					)}**\n__${titleCase(card.rank)}__ | Level ${
						card.character_level
					}`
					: `Not Assigned | ${item.itemName && item.item_id ? emojiMap(item.itemName) : "Not Equipped"}`
			}`;
		})
		.join("\n\n")}\n\n**__Total Stats__**\n\n**Team HP:** ${
		totalTeamStats.strength
	}\n**Team ATK:** ${totalTeamStats.vitality}\n**Team DEF:** ${
		totalTeamStats.defense
	}\n**Team INT:** ${totalTeamStats.intelligence}\n**Team SPD:** ${
		totalTeamStats.dexterity
	}\n\n**Power Level:** ${totalTeamPowerLevel}`;

	return {
		title: `Team ${name}`,
		desc,
	};
}

function prepareDefaultTeamDescription() {
	const desc = "The Positions of the assigned cards are listed below.\n\n" + 
        `${[ 1, 2, 3 ].map((i) => `__Position #${i}__\nNot Assigned`).join("\n\n")}\n\n**__Total Stats__** 0`;

	return desc;
}