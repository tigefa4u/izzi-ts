import { RaidActionProps } from "@customTypes/raids";
import { createEmbed } from "commons/embeds";
import { IZZI_WEBSITE } from "environment";
import loggers from "loggers";

export const redeemEventCard = async ({ options, context, client }: RaidActionProps) => {
	try {
		const embed = createEmbed(options.author, client);
		embed
			.setTitle("Redeem Event Cards")
			.setDescription(`You can redeem Event Cards in Exchange for Shards [here](${IZZI_WEBSITE}/events)`);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.events.redeemEventCard(): something went wrong", err);
		return;
	}
};