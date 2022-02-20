import { createSelectMenuProps } from "@customTypes/selectMenu";
import { MessageSelectMenu } from "discord.js";

export const createSelectMenu: createSelectMenuProps = (id, options) => {
	const selectMenu = new MessageSelectMenu()
		.setCustomId(id)
		.addOptions(options.menuOptions);

	if (options.extras?.placeholder) {
		selectMenu.setPlaceholder(options.extras.placeholder);
	}

	return selectMenu;
};