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
				order: "guilds",
				orderName: "Guild / Clan"
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
		} else if (subcommand === "game_points") {
			Object.assign(params, {
				lb: "gp",
				orderName: "Game Points",
				order: "game_points"
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
			lb
		);
		const embed = createEmbed(author, client);
		embed
			.setDescription(
				`Top 10 User ${titleCase(
					orderName
				)} on Izzi are shown below. Want to view more than Top 10 results? ` +
            `[Click here](${IZZI_WEBSITE}/leaderboards?lb=${lb}${lb === "ranks" ? "" : `?order=${order}`})` +
            "\n**The Leaderboard is updated every 15 minutes**"
			)
			.setTitle(`User ${titleCase(orderName)} Leaderboard`);
		if (fields.length > 0) embed.addFields(fields);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.leaderboard.getLB: ERROR", err);
		return;
	}
}
