import { BaseProps } from "@customTypes/command";
import Cache from "cache";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { battleRaidBoss } from "../actions/battle";
import { showEnergy } from "../actions/energy";
import { inviteToRaid } from "../actions/invite";
import { joinRaid } from "../actions/join";
import { kickmember } from "../actions/kick";
import { leaveLobby } from "../actions/leave";
import { raidLobbies } from "../actions/lobbies";
import { makeLeader } from "../actions/makeLeader";
import { raidParty } from "../actions/party";
import { memberReady } from "../actions/ready";
import { spawnRaid } from "../actions/spawn";
import { startRaid } from "../actions/start";
import { toggleLobbyType } from "../actions/toggleLobbyType";
import { viewRaid } from "../actions/view";
import { voteKickMember } from "../actions/votekick";
import { subcommands } from "../subcommands";
import { redeemEventCard } from "./redeem";

export const eventActions = async ({
	context,
	client,
	options,
	args,
	command,
}: BaseProps) => {
	try {
		// const disableRaids = await Cache.get("disable-raids");
		// const disableEvents = await Cache.get("disable-events");
		// if (disableEvents || !disableRaids) {
		// 	context.channel?.sendMessage("There are currently no events.");
		// 	return;
		// }
		const subcommand = filterSubCommands(
			args.shift() || "lobbies",
			subcommands
		);
		const params = {
			context,
			client,
			args,
			options,
			command,
			isEvent: true,
		};
		if (subcommand === "spawn") {
			spawnRaid(params);
		} else if (subcommand === "lobbies") {
			raidLobbies(params);
		} else if (subcommand === "view") {
			viewRaid(params);
		} else if (subcommand === "party") {
			raidParty(params);
		} else if (subcommand === "makepublic") {
			toggleLobbyType({
				...params,
				isPrivate: false
			});
		} else if (subcommand === "makeprivate") {
			toggleLobbyType({
				...params,
				isPrivate: true
			});
		} else if (subcommand === "redeem") {
			redeemEventCard(params);
		} else if (subcommand === "energy") {
			showEnergy(params);
		} else if (subcommand === "ready") {
			memberReady(params);
		} else if (subcommand === "leave") {
			leaveLobby(params);
		} else if (subcommand === "votekick") {
			voteKickMember(params);
		} else if (subcommand === "kick") {
			kickmember(params);
		} else if (subcommand === "start") {
			startRaid(params);
		} else if (subcommand === "join") {
			joinRaid(params);
		} else if (subcommand === "invite") {
			inviteToRaid(params);
		} else if (subcommand === "battle") {
			battleRaidBoss(params);
		} else if (subcommand === "mlead") {
			makeLeader(params);
		}
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.raids.events.eventActions(): something went wrong",
			err
		);
		return;
	}
};