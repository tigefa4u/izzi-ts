import { DzFuncProps } from "@customTypes/darkZone";
import { getDzTeam } from "api/controllers/DarkZoneTeamsController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE } from "helpers/constants/constants";
import { prepareTeamForBattle } from "helpers/teams";
import loggers from "loggers";
import { battleRaidBoss } from "../../raids/actions/battle";

export const raidBattleWithDarkZoneTeam = async ({
	dzUser, context, client, options, args 
}: DzFuncProps) => {
	try {
		const disableRaids = await Cache.get("disable-raids");
		if (disableRaids) {
			context.channel?.sendMessage(
				"Command disabled, There could be an on going event. Use ``help event`` for more info"
			);
			return;
		}
		const { author } = options;
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!dzUser.selected_team_id) {
			embed.setDescription("Please select a valid team to participate in floor battles. " +
			"Type `iz dz tm set 1 1` and `iz dz tm select` to set and select your team.");
			context.channel?.sendMessage(embed);
			return;
		}
		const dzTeam = await getDzTeam(author.id);
		if (!dzTeam) {
			context.channel?.sendMessage("We could not find your Dark Zone Team. " +
            "Please create one using `iz dz tm set <#ID> <position>`");
			return;
		}
		const teamCards = dzTeam.team.filter((t) => t.collection_id !== null);
		if (teamCards.length <= 0) {
			embed.setDescription("There are no cards in your team. " +
            "Please select a valid team to participate in floor battles.\n\n" +
            "Use `iz dz tm set <#ID> <position>` to assign a card to your team.");
			context.channel?.sendMessage(embed);
			return;
		}
		const playerStats = await prepareTeamForBattle({
			team: {
				user_id: dzUser.user_id,
				name: author.username,
				metadata: dzTeam.team,
				id: dzTeam.id
			},
			isDarkZone: true,
			user_id: dzUser.user_id,
			id: author.id,
			canAddGuildStats: true,
			capCharacterMaxLevel: false,
		});
		if (!playerStats) {
			context.channel?.sendMessage("You do not have a valid Dark Zone team, Please reset your team " +
            "using `iz dz tm reset`");
			return;
		}
		args.shift();
		battleRaidBoss({
			context,
			client,
			options,
			args,
			isDarkZone: true,
			dzPlayerStats: {
				stats: playerStats,
				name: `Dark Zone ${playerStats.name}`
			},
			user_id: dzUser.user_id
		});
		return;
	} catch (err) {
		loggers.error("raidBattleWithDarkZoneTeam: ERROR", err);
		return;
	}
};