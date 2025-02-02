import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import { API_DOMAIN, IZZI_WEBSITE } from "environment";
import { createLBEmbedList } from "helpers/embedLists/leaderboard";
import { request } from "helpers/requestApiService";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { titleCase } from "title-case";
import { subcommands } from "./subcommands";

export const leaderboard = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const author = options.author;
		const lborder = args.shift();
		if (!lborder) return;
		const subcommand = filterSubCommands(lborder, subcommands);
		const params = {} as any;
		if (subcommand === "guild") {
			Object.assign(params, {
				lb: "guilds",
				order: "level",
				orderName: "Clan Level"
			});
		} else if (subcommand === "level") {
			Object.assign(params, {
				lb: "users",
				orderName: "level",
				order: "level"
			});
		} else if (subcommand === "zone") {
			Object.assign(params, {
				lb: "users",
				orderName: "zone",
				order: "max_ruin"
			});
		} else if (subcommand === "gold") {
			Object.assign(params, {
				lb: "users",
				orderName: "gold",
				order: "gold"
			});
		} else if (subcommand === "rank") {
			Object.assign(params, {
				lb: "ranks",
				orderName: "rank",
				order: "rank"
			});
		} else if (subcommand === "guild_level") {
			// Object.assign(params, {
			// 	lb: "guilds",
			// 	orderName: "Clan Level",
			// 	order: "level"
			// });
		} else if (subcommand === "mythical") {
			Object.assign(params, {
				lb: "ultimate",
				orderName: "mythical cards",
				order: "myth"
			});
		} else if (subcommand === "ultimate") {
			Object.assign(params, {
				lb: "ultimate",
				orderName: "ultimate cards",
				order: "ult"
			});
		} else if (subcommand === "vote_count") {
			Object.assign(params, {
				lb: "users",
				orderName: "vote count",
				order: "vote_count"
			});
		} else if (subcommand === "dark_zone") {
			Object.assign(params, {
				lb: "darkZone",
				orderName: "dark zone max floor",
				order: "max_floor"
			});
		}
		getLB(context, author, client, params.order, params.orderName, params.lb);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.leaderboard.leaderboard: ERROR",
			err
		);
		return;
	}
};

function prepareUrl(lb: string, order: string) {
	// const base = "http://localhost:5011/api/v1/ums";
	const base = `${API_DOMAIN}/api/v1/ums`;
	const url = `/leaderboards/${lb}?per_page=10&order=${order}`;
	return base + url;
}

async function getLB(
	context: BaseProps["context"],
	author: AuthorProps,
	client: Client,
	order: string,
	orderName: string,
	lb: string
) {
	try {
		const topResults = await request(prepareUrl(lb, order));
		if (!topResults) return;
		const fields = await createLBEmbedList(
			topResults,
			client,
			orderName,
			lb,
			order
		);
		const embed = createEmbed(author, client);
		embed.setTitle(`User ${titleCase(orderName)} Leaderboard`);

		if (lb === "ultimate") {
			embed.setDescription(
				`Users with most ${titleCase(orderName)} on Izzi are shown below.`
			);
		} else {
			embed.setDescription(
				`Top 10 User ${titleCase(
					orderName
				)} on Izzi are shown below. Want to view more than Top 10 results? ` +
            `[Click here](${IZZI_WEBSITE}/leaderboards?lb=${lb}${lb === "ranks" ? "" : `&order=${order}`})` +
            "\n**The Leaderboard is updated every 15 minutes**"
			);
		}
		if (fields.length > 0) embed.addFields(fields);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.leaderboard.getLB: ERROR", err);
		return;
	}
}
