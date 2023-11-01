import { DzFuncProps } from "@customTypes/darkZone";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { CACHE_KEYS } from "helpers/constants/cacheConstants";
import {
	DZ_INVENTORY_SLOTS_PER_LEVEL,
	DZ_STARTER_INVENTORY_SLOTS,
} from "helpers/constants/darkZone";
import loggers from "loggers";

export const dzConsole = async ({
	context,
	client,
	options,
	dzUser,
}: DzFuncProps) => {
	try {
		const { author } = options;
		const inAdventure = await Cache.get(CACHE_KEYS.ADVENTURE + author.id);
		let adventureStatus;
		if (inAdventure) {
			const res: { timestamp: number } = JSON.parse(inAdventure);
			const HOUR = 1000 * 60 * 60;
			const anHourAgo = new Date().getTime() - HOUR;
			if (res.timestamp > anHourAgo) {
				const remainingTime = res.timestamp - anHourAgo;
				let minutes = Math.floor(remainingTime / 1000 / 60);
				let seconds = Math.ceil((remainingTime / 1000) % 60);
				if (seconds < 0) seconds = 0;
				if (minutes < 0) minutes = 0;
				adventureStatus = `Inprogress (${minutes}m ${seconds}s)`;
			} else {
				adventureStatus = "Completed. Type `iz dz adv complete` to claim loot.";
			}
		}

		const maxSlots =
      dzUser.level * DZ_INVENTORY_SLOTS_PER_LEVEL +
      (DZ_STARTER_INVENTORY_SLOTS - DZ_INVENTORY_SLOTS_PER_LEVEL);

		const embed = createEmbed(author, client)
			.setTitle("Dark Zone Console " + emoji.crossedswords)
			.setHideConsoleButtons(true)
			.setDescription(
				`**${emoji.fragments} Fragments:** ${numericWithComma(
					dzUser.fragments
				)}\n**:card_index: Exp:** [${numericWithComma(
					dzUser.exp
				)} / ${numericWithComma(dzUser.r_exp)}]\n**${
					emoji.dagger
				} Inventory Slots:** [${numericWithComma(
					dzUser.inventory_count
				)} / ${numericWithComma(maxSlots)}]\n**${
					emoji.crossedswords
				} Current Floor:** ${numericWithComma(dzUser.floor)}${
					dzUser.floor < dzUser.max_floor ? " (Farming)" : ""
				}\n**${emoji.crossedswords} Max Floors Reached:** ${numericWithComma(
					dzUser.max_floor
				)}\n**${emoji.zoneic} Adventure Status:** ${
					adventureStatus
						? adventureStatus
						: "Use `iz dz adv` to send your team on an adventure."
				}`
			)
			.setFooter({ text: "Did you know? You can use `iz dz bt all`" });

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("information.dzConsole: ERROR", err);
		return;
	}
};
