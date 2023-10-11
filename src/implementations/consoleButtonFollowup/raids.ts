import { CustomButtonInteractionParams } from "@customTypes/button";
import { BaseProps } from "@customTypes/command";
import Cache from "cache";
import { CONSOLE_BUTTONS } from "helpers/constants/constants";
import { prepareAndSendConsoleMenu } from "implementations/consoleButtons";
import loggers from "loggers";
import { raidActions } from "modules/commands/rpg/raids";
import { eventActions } from "modules/commands/rpg/raids/events";
import { customButtonInteraction } from "utility/ButtonInteractions";

const handleRaidSpawnDifficultyButtons = async ({
	id, client, channel, message, user_tag 
}: P) => {
	const [ author, disableRaids ] = await Promise.all([
		client.users.fetch(user_tag),
		Cache.get("disable-raids")
	]);
	const options = {
		context: { channel } as BaseProps["context"],
		client,
		options: { author },
		args: [] as string[]
	};
	let isEvent = false;
	if (disableRaids) {
		isEvent = true;
	}
	let difficulty = "i";
	switch (id) {
		case CONSOLE_BUTTONS.BACK.id: {
			showRaidCommands({
				id,
				channel,
				client,
				message,
				user_tag
			});
			return;
		}
		case "easy": {
			difficulty = "e";
			break;
		}
		case "medium": {
			difficulty = "m";
			break;
		}
		case "hard": {
			difficulty = "h";
			break;
		}
		case "immortal": {
			difficulty = "i";
			break;
		}
	}
	options.args = [ "spawn", difficulty, "-p" ];
	if (isEvent) {
		eventActions(options);
	} else {
		raidActions(options);
	}
	showRaidCommands({
		id,
		channel,
		client,
		message,
		user_tag
	});
	return;
};

const showRaidSpawnDifficulty = async ({ message, channel, user_tag }: Pick<P, "message" | "channel" | "user_tag">) => {
	const buttons = customButtonInteraction(
		channel,
		[
			{
				label: "Easy",
				params: { id: "easy" }
			},
			{
				label: "Medium",
				params: { id: "medium" }
			},
			{
				label: "Hard",
				params: { id: "hard" }
			},
			{
				label: "Immortal",
				params: { id: "immortal" }
			},
			{
				label: CONSOLE_BUTTONS.BACK.label,
				params: { id: CONSOLE_BUTTONS.BACK.id },
				style: "SECONDARY"
			}
		],
		user_tag,
		handleRaidSpawnDifficultyButtons,
		() => {
			return;
		},
		false,
		10
	);
	if (!buttons) return;
	message.editButton(buttons);
};

const handleRaidButtons = async ({
	id, channel, client, user_tag, message
}: P) => {
	const author = await client.users.fetch(user_tag);
	const options = {
		context: { channel } as BaseProps["context"],
		args: [ "all" ],
		client,
		options: { author },
	};
	const [ disableRaids, rconfig ] = await Promise.all([
		Cache.get("disable-raids"),
		Cache.get("rconfig::" + user_tag)
	]);
	let isEvent = false;
	if (disableRaids) {
		isEvent = true;
	}
	switch (id) {
		case CONSOLE_BUTTONS.RAID_BATTLE.id: {
			options.args = [ "bt" ];
			if (isEvent) {
				eventActions(options);
			} else {
				raidActions(options);
			}
			return;
		}
		case CONSOLE_BUTTONS.RAID_VIEW.id: {
			options.args = [ "view" ];
			if (isEvent) {
				eventActions(options);
			} else {
				raidActions(options);
			}
			return;
		}
		case CONSOLE_BUTTONS.RAID_MAKE_PRIVATE.id: {
			options.args = [ "mprivate" ];
			if (isEvent) {
				eventActions(options);
			} else {
				raidActions(options);
			}
			return;
		}
		case CONSOLE_BUTTONS.RAID_MAKE_PUBLIC.id: {
			options.args = [ "mpublic" ];
			if (isEvent) {
				eventActions(options);
			} else {
				raidActions(options);
			}
			return;
		}
		case CONSOLE_BUTTONS.RAID_START.id: {
			options.args = [ "start" ];
			if (isEvent) {
				eventActions(options);
			} else {
				raidActions(options);
			}
			return;
		}
		case CONSOLE_BUTTONS.CONSOLE.id: {
			prepareAndSendConsoleMenu({
				channel,
				user_tag,
				client,
				id,
				message
			});
			return;
		}
		case CONSOLE_BUTTONS.RAID_SPAWN.id: {
			showRaidSpawnDifficulty({
				message,
				channel,
				user_tag
			});
			// let difficulty = "e";
			// if (rconfig) {
			// 	const { difficulty: configDifficulty } = JSON.parse(rconfig);
			// 	difficulty = configDifficulty;
			// }
			// options.args = [ "spawn", difficulty, "-p" ];
			// if (isEvent) {
			// 	eventActions(options);
			// } else {
			// 	raidActions(options);
			// }
			return;
		}
		case CONSOLE_BUTTONS.RAID_LEAVE.id: {
			options.args = [ "leave" ];
			if (isEvent) {
				eventActions(options);
			} else {
				raidActions(options);
			}
			return;
		}
		case CONSOLE_BUTTONS.RAID_PARTY.id: {
			options.args = [ "party" ];
			if (isEvent) {
				eventActions(options);
			} else {
				raidActions(options);
			}
			return;	
		}
	}
};

type P = CustomButtonInteractionParams;
export const showRaidCommands = async ({
	id,
	channel,
	client,
	message,
	user_tag,
}: P) => {
	try {
		const buttons = customButtonInteraction(
			channel,
			[
				{
					label: CONSOLE_BUTTONS.RAID_SPAWN.label,
					params: { id: CONSOLE_BUTTONS.RAID_SPAWN.id }
				},
				{
					label: CONSOLE_BUTTONS.RAID_BATTLE.label,
					params: { id: CONSOLE_BUTTONS.RAID_BATTLE.id },
				},
				{
					label: CONSOLE_BUTTONS.RAID_VIEW.label,
					params: { id: CONSOLE_BUTTONS.RAID_VIEW.id },
				},
				{
					label: CONSOLE_BUTTONS.RAID_START.label,
					params: { id: CONSOLE_BUTTONS.RAID_START.id },
				},
				{
					label: CONSOLE_BUTTONS.RAID_MAKE_PRIVATE.label,
					params: { id: CONSOLE_BUTTONS.RAID_MAKE_PRIVATE.id },
				},
				{
					label: CONSOLE_BUTTONS.RAID_MAKE_PUBLIC.label,
					params: { id: CONSOLE_BUTTONS.RAID_MAKE_PUBLIC.id },
				},
				{
					label: CONSOLE_BUTTONS.RAID_LEAVE.label,
					params: { id: CONSOLE_BUTTONS.RAID_LEAVE.id }
				},
				{
					label: CONSOLE_BUTTONS.RAID_PARTY.label,
					params: { id: CONSOLE_BUTTONS.RAID_PARTY.id }
				},
				{
					label: CONSOLE_BUTTONS.CONSOLE.label,
					params: { id: CONSOLE_BUTTONS.CONSOLE.id },
					style: "SECONDARY"
				}
			],
			user_tag,
			handleRaidButtons,
			() => {
				return;
			},
			false,
			10
		);

		if (!buttons) return;
		message.editButton(buttons);
	} catch (err) {
		loggers.error(
			"consoleButtonFollowup.showRaidCommands: ERROR",
			err
		);
	}
	return;
};
