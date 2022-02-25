import { RaidActionProps } from "@customTypes/raids";
import { getRPGUser } from "api/controllers/UsersController";
import { ENERGY_PER_ATTACK } from "helpers/constants";
import loggers from "loggers";
import { getCooldown } from "modules/cooldowns";
import { validateCurrentRaid } from "./validateRaid";
import * as battleInChannel from "../../adventure/battle/battlesPerChannelState";
import { prepareSkewedCollectionsForBattle, validateAndPrepareTeam } from "helpers/teams";

export const battleRaidBoss = async ({
	context, options, client, isEvent, args 
}: RaidActionProps) => {
	try {
		const author = options.author;
		const inBattle = await getCooldown(author.id, `${isEvent ? "event" : "raid"}-battle`);
		if (inBattle) {
			context.channel?.sendMessage("Your battle is still in progress");
			return;
		}
		const battles = battleInChannel.validateBattlesInChannel(context.channel?.id || "");
		if (battles === undefined) return;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		if (!user.selected_team_id) {
			context.channel?.sendMessage("Please select a valid Team!");
			return;
		}
		const currentRaid = await validateCurrentRaid(user.id, author, client, context.channel);
		if (!currentRaid) return;
		if (!currentRaid.is_start) {
			context.channel?.sendMessage(`The ${isEvent ? "Event" : "Raid"} Challenge has not started yet!`);
			return;
		}
		const attacker = currentRaid.lobby[user.id];
		if (!attacker) {
			context.channel?.sendMessage("Unable to attack, please report");
			throw new Error("Unable to find attacker in lobby: user ID: " + user.id);
		}
		if (attacker.energy < ENERGY_PER_ATTACK) {
			context.channel?.sendMessage("You do not have sufficient energy to attack!");
			return;
		}

		const playerStats = validateAndPrepareTeam(
			user.id,
			user.user_tag,
			user.selected_team_id,
			context.channel
		);
		if (!playerStats) return;

		const raidBoss = currentRaid.raid_boss;
		prepareSkewedCollectionsForBattle({
			collections: raidBoss,
			id: "raid boss",
			name: `XeneX's ${isEvent ? "Event" : "Raid"} Boss`,
		});

		let multiplier = 1;
		if (args.shift() === "all") multiplier = Math.floor(attacker.energy / ENERGY_PER_ATTACK);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.actions.battleRaidBoss(): something went wrong", err);
		return;
	}
};