import { BaseProps } from "@customTypes/command";
import { DzFuncProps } from "@customTypes/darkZone";
import { getDarkZoneProfile } from "api/controllers/DarkZoneController";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { listDzCommands } from "./actions/listDzCommands";
import { showcaseDzCard } from "./actions/showcase";
import { startDz } from "./actions/start";
import { viewDzProfile } from "./actions/viewProfile";
import { sendOnAdventure } from "./adventure";
import { battleDzFloor } from "./adventure/battle";
import { darkZoneDex } from "./information/dex";
import { viewDzInventory } from "./information/inventory";
import { buyDzCard } from "./information/buyFromDex";
import { subcommands } from "./subcommands";
import { dzTeamCommands } from "./team";
import { dzConsole } from "./information/console";
import { dzPvpBattle } from "./pvp";
import { enchantDzCard } from "./enchantmentAndEvolution/enchant";
import { spawnDzRaid } from "./adventure/spawnRaid";
import { evoDzCard } from "./enchantmentAndEvolution/evolution";
import { upgradeDzStatPoint } from "./enchantmentAndEvolution/upgradeStatPoints";
import { giveDzCard } from "./actions/cardGive";
import { dzMarketCommands } from "./market";
import { giveFragments } from "./actions/give";
import { DARK_ZONE_MIN_LEVEL } from "helpers/constants/constants";

export const invokeDarkZone = async (params: BaseProps) => {
	try {
		params.context.channel?.sendMessage("Dark Zone is currently disabled");
		return;
		// const cmd = filterSubCommands(params.args.shift() || "commands", subcommands) || "commands";
		// if (cmd === "commands") {
		// 	listDzCommands(params);
		// 	return;
		// }
		// const dzUser = await getDarkZoneProfile({ user_tag: params.options.author.id });
		// if (cmd === "start") {
		// 	startDz({
		// 		...params,
		// 		dzUser
		// 	});
		// 	return;
		// }
		// if (!dzUser) {
		// 	params.context.channel?.sendMessage(
		// 		`Summoner **${params.options.author.username}**, You have not started your ` +
		//         "journey in the Dark Zone. Type `iz dz start`, " +
		// 		`you must be at least level ${DARK_ZONE_MIN_LEVEL}.`
		// 	);
		// 	return;
		// }
		// const paramObject: DzFuncProps = {
		// 	...params,
		// 	dzUser
		// };
		// if (cmd === "profile") {
		// 	viewDzProfile(paramObject);
		// } else if (cmd === "dex") {
		// 	darkZoneDex(paramObject);
		// } else if (cmd === "buy") {
		// 	buyDzCard(paramObject);
		// } else if (cmd === "inventory") {
		// 	viewDzInventory(paramObject);
		// } else if (cmd === "showcase") {
		// 	showcaseDzCard(paramObject);
		// } else if (cmd === "adventure") {
		// 	sendOnAdventure(paramObject);
		// } else if (cmd === "battle") {
		// 	battleDzFloor(paramObject);
		// } else if (cmd === "team") {
		// 	dzTeamCommands(paramObject);
		// } else if (cmd === "console") {
		// 	dzConsole(paramObject);
		// } else if (cmd === "pvp") {
		// 	dzPvpBattle(paramObject);
		// } else if (cmd === "enchantment") {
		// 	enchantDzCard(paramObject);
		// } else if (cmd === "spawn") {
		// 	spawnDzRaid(paramObject);
		// } else if (cmd === "evolution") {
		// 	evoDzCard(paramObject);
		// } else if (cmd === "stat-point") {
		// 	upgradeDzStatPoint(paramObject);
		// } else if (cmd === "give") {
		// 	giveFragments(paramObject);
		// } else if (cmd === "cgive") {
		// 	giveDzCard(paramObject);
		// } else if (cmd === "market") {
		// 	dzMarketCommands(paramObject);
		// }
		// return;
	} catch (err) {
		loggers.error("invokeDarkZone: ERROR", err);
		return;
	}
};