import { DzFuncProps } from "@customTypes/darkZone";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { listMarket } from "../../market";
import { buyDzCardFromMarket } from "./buy";
import { removeDzCardFromMarket } from "./remove";
import { sellDzCardOnMarket } from "./sell";
import { subcommands } from "./subcommands";

export const dzMarketCommands = async (params: DzFuncProps) => {
	try {
		const cmd = filterSubCommands(params.args.shift() || "list", subcommands) || "list";
		if (cmd === "sell") {
			sellDzCardOnMarket(params);
			return;
		} else if (cmd === "remove") {
			removeDzCardFromMarket(params);
			return;
		} else if (cmd === "buy") {
			buyDzCardFromMarket(params);
			return;
		}
		listMarket({
			...params,
			isDarkZone: true
		});
	} catch (err) {
		loggers.error("dzMarketCommands: ERROR", err);
		return;
	}
};