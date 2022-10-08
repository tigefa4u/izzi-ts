import { ChannelProp } from "@customTypes";
import { CustomButtonInteractionParams } from "@customTypes/button";
import { BaseProps } from "@customTypes/command";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { Client, Message } from "discord.js";
import { CONSOLE_BUTTONS } from "helpers/constants";
import { prepareAndSendConsoleMenu } from "implementations/consoleButtons";
import loggers from "loggers";
import { raidActions } from "modules/commands/rpg/raids";
import { eventActions } from "modules/commands/rpg/raids/events";
import { customButtonInteraction } from "utility/ButtonInteractions";

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
			let difficulty = "e";
			if (rconfig) {
				const { difficulty: configDifficulty } = JSON.parse(rconfig);
				difficulty = configDifficulty;
			}
			options.args = [ "spawn", difficulty, "-p" ];
			if (isEvent) {
				eventActions(options);
			} else {
				raidActions(options);
			}
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
			true,
			10
		);

		if (!buttons) return;
		message.editButton(buttons);
	} catch (err) {
		loggers.error(
			"consoleButtonFollowup.showRaidCommands(): something went wrong",
			err
		);
	}
	return;
};
