import { BaseProps } from "@customTypes/command";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { removeWishlist } from "./remove";
import { subcommands } from "./subcommands";
import { viewWishlist } from "./view";

export const wishlist = (params: BaseProps) => {
	try {
		const opt = params.args.shift() || "show";
		const subcommand = filterSubCommands(opt, subcommands);
		if (subcommand === "show") {
			viewWishlist(params);
		} else if (subcommand === "remove") {
			removeWishlist(params);
		}
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.wishlist.index: ERROR", err);
		return;
	}
};