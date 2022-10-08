import { ChannelProp } from "@customTypes";
import { CustomButtonInteractionParams } from "@customTypes/button";
import { BaseProps } from "@customTypes/command";
import { CustomEmbedProps } from "@customTypes/embed";
import { Client } from "discord.js";
import { CONSOLE_BUTTONS } from "helpers/constants";
import loggers from "loggers";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { battle } from "../adventure";

const btFloorBoss = async ({ channel, user_tag, client }: CustomButtonInteractionParams) => {
	const author = await client.users.fetch(user_tag);
	battle({
		context: { channel } as BaseProps["context"],
		args: [],
		options: { author },
		client
	});
	return;
};

type P = {
    embed: CustomEmbedProps;
    channel: ChannelProp;
}
export const attachButtonToFloorEmbed = ({ embed, channel }: P) => {
	try {
		const buttons = customButtonInteraction(
			channel,
			[
				{
					label: CONSOLE_BUTTONS.FLOOR_BT.label,
					params: { id: CONSOLE_BUTTONS.FLOOR_BT.id }
				}
			],
			"",
			btFloorBoss,
			() => {
				return;
			},
			true,
			10
		);

		if (buttons) {
			embed.setButtons(buttons);
		}
	} catch (err) {
		loggers.error("zoneAndFloor.index.attachButtonToFloorEmbed(): something went wrong", err);
	}
	return embed;
};