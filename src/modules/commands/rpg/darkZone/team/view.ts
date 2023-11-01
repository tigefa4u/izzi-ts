import { CollectionCardInfoProps } from "@customTypes/collections";
import { DzFuncProps } from "@customTypes/darkZone";
import { TeamMeta } from "@customTypes/teams";
import { getDzInvById } from "api/controllers/DarkZoneInventoryController";
import { getDzTeam } from "api/controllers/DarkZoneTeamsController";
import { getGuildMember } from "api/controllers/GuildMembersController";
import { getGuild } from "api/controllers/GuildsController";
import { createEmbed } from "commons/embeds";
import { prepareTotalOverallStats } from "helpers/teams";
import loggers from "loggers";
import { prepareDefaultTeamDescription, prepareTeamDescription } from "../../team/index";

export const viewDzTeam = async ({ context, client, options, dzUser }: DzFuncProps) => {
	try {
		const { author } = options;
		const dzTeam = await getDzTeam(author.id);
		const embed = createEmbed(author, client).setTitle("Dark Zone Team View")
			.setHideConsoleButtons(true);
		if (!dzTeam) {
			embed.setDescription(prepareDefaultTeamDescription());
			context.channel?.sendMessage(embed);
			return;
		}
		const desc = await showDzTeam(author.id, dzTeam.team, dzUser.user_id);
		embed.setDescription(desc || "");
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("viewDzTeam: ERROR", err);
	}
};


const showDzTeam = async (user_tag: string, team: TeamMeta[], user_id: number) => {
	try {
		const ids = team
			.map((m) => Number((m || {}).collection_id))
			.filter(Boolean);

		const teamPosition = team.filter(Boolean).sort((a) => a.position);
		let totalOverallStats;
		if (ids.length > 0) {
			const collections = await getDzInvById({
				id: ids,
				user_tag
			}) as CollectionCardInfoProps[] | undefined;
			if (!collections) return;
			let guildStats;
			const guildMember = await getGuildMember({ user_id });
			if (guildMember) {
				const guild = await getGuild({ id: guildMember.guild_id });
				if (guild) {
					guildStats = guild.guild_stats;
				}
			}
			totalOverallStats = await prepareTotalOverallStats({
				collections,
				isBattle: false,
				guildStats
			});
		}
		if (!totalOverallStats) {
			return prepareDefaultTeamDescription();
		}
		return prepareTeamDescription(totalOverallStats, teamPosition);
	} catch (err) {
		loggers.error("view.showDzTeam: ERROR", err);
		return;
	}
};