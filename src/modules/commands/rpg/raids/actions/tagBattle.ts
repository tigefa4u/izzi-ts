import { RaidActionProps } from "@customTypes/raids";
import { getUserRaidLobby } from "api/controllers/RaidsController";
import { GetTagTeamPlayer, updateTagTeamPoints } from "api/controllers/TagTeamsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE, TEAM_POINTS_PER_TASK } from "helpers/constants/constants";
import loggers from "loggers";
import { getCooldown, sendCommandCDResponse, setCooldown } from "modules/cooldowns";
import { battleRaidBoss } from "./battle";

export const tagTeamBattle = async (params: RaidActionProps) => {
	try {
		let isBtAll = false;
		const {
			context,
			client,
			args,
			options
		} = params;
		const arg = args.shift();
		if (arg === "all") isBtAll = true;
		const { author } = options;
		const cmd = "raid-tag";
		const cd = await  getCooldown(author.id, cmd);
		if (cd) {
			sendCommandCDResponse(context.channel, cd, author.id, cmd);
			return;
		}
		const tagTeam = await GetTagTeamPlayer({ user_tag: author.id });
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);

		if (!tagTeam) {
			embed.setDescription(`Summoner **${author.username}**, you do not have a ` +
            "tag teammate. Use ``iz cons tag <@user>`` to team up with another player.");

			context.channel?.sendMessage(embed);
			return;
		}
		const player = tagTeam.players[author.id];
		loggers.info(`raids.tagBattle: ${author.id} has invoked raid battle for teammate: ${player.teammate}`);
		const [ teammateUser, player2 ] = await Promise.all([
			getRPGUser({ user_tag: player.teammate }),
			client.users.fetch(player.teammate)
		]);
		if (!teammateUser) return;
		await battleRaidBoss({
			...params,
			args: isBtAll ? [ "all", "hidebt" ] : [ "hidebt" ],
			options: { author: player2 },
			callback: async (raidId) => {
				loggers.info("Tag Raid Battle has completed for raid:", raidId);
				const [ dmChannel ] = await Promise.all([
					player2.createDM(),
					setCooldown(author.id, cmd, 60 * 60 * 2), // 2hr cd
					updateTagTeamPoints({ id: tagTeam.id }, TEAM_POINTS_PER_TASK)
				]);
				const dmEmbed = createEmbed(author, client).setTitle("Tag Team Battle")
					.setDescription(`Summoner **${author.username} (${author.id})** has started a raid battle in ` +
                    `your raid. ID: ${raidId}`)
					.setTimestamp();
				dmChannel.sendMessage(dmEmbed);
			},
		});
		// Not checking for raid since teammate can attack even if they
		// are not in the same raid (for now)
		// const raid = await getUserRaidLobby({ user_id: teammateUser.id });
		// if (!raid) {
		// 	embed.setDescription(`Summoner **${author.username}**, ${player2.username} ` +
		//     "is currently not in a raid.");
		// 	context.channel?.sendMessage(embed);
		// 	return;
		// }
		return;
	} catch (err) {
		loggers.error("raids.actions.tagBattle: ERROR", err);
		return;
	}
};