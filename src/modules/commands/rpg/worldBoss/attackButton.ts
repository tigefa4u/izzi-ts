import { ChannelProp } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { CONSOLE_BUTTONS } from "helpers/constants";
import loggers from "loggers";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { battleWB } from "./battle";

type A = {
    authorId: string;
    bypassFilter: boolean;
    channel: ChannelProp;
}
export const attackButton = ({ channel, bypassFilter, authorId }: A) => {
	try {
		const buttons = customButtonInteraction(
			channel,
			[ {
				label: CONSOLE_BUTTONS.ATTACK_WORLDBOSS.label,
				params: { id: CONSOLE_BUTTONS.ATTACK_WORLDBOSS.id }
			} ],
			authorId,
			async ({
				user_tag, client, channel, message, id 
			}) => {
				if (id === CONSOLE_BUTTONS.ATTACK_WORLDBOSS.id) {
					const author = await client.users.fetch(user_tag);
					const options = {
						context: { channel } as BaseProps["context"],
						args: [],
						client,
						options: { author }
					};
					battleWB(options);
				}
				return;
			},
			() => {
				return;
			},
			bypassFilter,
			1
		);

		return buttons;
	} catch (err) {
		loggers.error("worldBoss.attackButton: ERROR", err);
		return;
	}
};