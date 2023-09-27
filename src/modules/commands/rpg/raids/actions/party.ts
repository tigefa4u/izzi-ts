import { RaidActionProps, RaidLobbyProps } from "@customTypes/raids";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { prepareHPBar } from "helpers/adventure";
import { processHpBar, relativeDiff } from "helpers/battle";
import { getLobbyMvp } from "helpers/raid";
import loggers from "loggers";
import { titleCase } from "title-case";
import { prepareRaidTimer } from "..";
import { validateCurrentRaid } from "./validateRaid";

export const raidParty = async ({
	context,
	options,
	isEvent,
	client,
}: RaidActionProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const currentRaid = await validateCurrentRaid(
			user.id,
			author,
			client,
			context.channel
		);
		if (!currentRaid) return;

		const damageDiff = relativeDiff(
			currentRaid.stats.remaining_strength,
			currentRaid.stats.original_strength,
			8
		);

		const fakeHp = processHpBar(
			{
				health: prepareHPBar(8),
				strength: currentRaid.stats.remaining_strength,
			},
			damageDiff
		).health;

		const embed = createEmbed(author, client)
			.setTitle(`Challenger Lobby/Party ${prepareRaidTimer(currentRaid)}`)
			.setDescription(
				`**Level ${currentRaid.stats.battle_stats.boss_level} ${
					isEvent ? "Event" : "Raid"
				} Boss [${titleCase(currentRaid.stats.difficulty)}]\n${numericWithComma(
					currentRaid.stats.remaining_strength
				)} / ${numericWithComma(currentRaid.stats.original_strength)} ${
					emoji.hp
				}**\n${fakeHp.map((i) => i).join("")}\n\n${prepareRaidParty(
					currentRaid.lobby
				)}`
			)
			.setFooter({
				text: `Lobby code: ${currentRaid.id}`,
				iconURL: author.displayAvatarURL(),
			});

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.actions.raidParty: ERROR", err);
		return;
	}
};

export function prepareRaidParty(lobby: RaidLobbyProps) {
	const keys = Object.keys(lobby).map((k) => Number(k));
	const lobbyMembers: (keyof RaidLobbyProps)[] = keys.sort((a) =>
		lobby[a].is_leader === true ? -1 : 1
	);
	return lobbyMembers
		.map((l, i) => {
			const timeElapsed = Math.abs(new Date(lobby[l].timestamp).valueOf() - new Date().valueOf()) / 1000;
			const remainingMS = timeElapsed / 60;
			const elapsedHours = Math.floor(remainingMS / 60);
			const elapsedMinutes = Math.floor(remainingMS % 60);
			const elapsedSeconds = timeElapsed % 60;
			const mvpUserId = getLobbyMvp(lobby);
			return `#${i + 1} **${lobby[l].username} (${lobby[l].user_tag}) ${
				mvpUserId && mvpUserId === l ? "[MVP] :crown:" : ""
			}**${lobby[l].is_leader ? "\n**Lobby Leader**" : ""}\nLevel: ${
				lobby[l].level
			}\nVote Kick ID: ${lobby[l].user_id}\nEnergy: ${
				lobby[l].energy
			}\nTotal Damage: ${numericWithComma(lobby[l].total_damage)}\nTotal Team Damage: ${
				numericWithComma(lobby[l].total_team_damage || 0)
			}\nTotal Attacks: ${
				lobby[l].total_attack
			}\nLast Attack: ${elapsedHours ? `${elapsedHours}h` : ""} ${
				elapsedMinutes ? `${elapsedMinutes}m` : ""
			} ${elapsedSeconds > 0 ? `${elapsedSeconds.toFixed(0)}sec` : ""}${
				!elapsedMinutes && !elapsedHours && !elapsedSeconds ? "0" : ""
			}`;
		})
		.join("\n\n");
}
