import { XPGainPerRankProps } from "@customTypes";
import { CollectionCreateProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { CrateCategoryProps } from "@customTypes/crates";
import { getRandomCard } from "api/controllers/CardsController";
import { createCollection } from "api/controllers/CollectionsController";
import {
	delCrate,
	getCrate,
	getCrates,
} from "api/controllers/CratesController";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { probability } from "helpers";
import { BASE_XP, PAGE_FILTER, XP_GAIN_EXPONENT } from "helpers/constants";
import { createEmbedList } from "helpers/embedLists";
import { createCrateList } from "helpers/embedLists/crates";
import { RankProps } from "helpers/helperTypes";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { titleCase } from "title-case";
import { clone } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { fetchParamsFromArgs } from "utility/forParams";
import { subcommands } from "./subcommands";

async function openCrate({ context, client, args, options }: BaseProps) {
	try {
		const author = options.author;
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const crate = await getCrate({
			id,
			user_tag: user.user_tag,
		});
		if (!crate) return;
		const ranks: string[] = [];
		const probabilities: number[] = [];
		const orbs = crate.contents.orbs;
		if (orbs) {
			user.orbs = user.orbs + orbs;
			await updateRPGUser({ user_tag: user.user_tag }, { orbs: user.orbs });
		}
		Object.keys(crate.contents.cards).forEach((key) => {
			ranks.push(key);
			probabilities.push(crate.contents.cards[key as keyof XPGainPerRankProps]);
		});
		const cardsReceived: { rank: RankProps; name: string }[] = [];
		const collectionBody: CollectionCreateProps[] = [];
		const num = crate.contents.numberOfCards || 1;
		for (let i = 0; i < num; i ++) {
			const randomCard = await getRandomCard(
				{ rank: ranks[probability(probabilities)] },
				1
			);
			if (randomCard && randomCard.length > 0) {
				const card = randomCard[0];
				const PL = await getPowerLevelByRank({ rank: card.rank });
				if (!PL) return;
				collectionBody.push({
					character_id: card.character_id,
					rank: card.rank,
					rank_id: PL.rank_id,
					character_level: 1,
					exp: 1,
					r_exp: BASE_XP * XP_GAIN_EXPONENT,
					user_id: user.id,
					is_item: false,
					is_on_cooldown: false,
					is_tradable: true
				});
				cardsReceived.push({
					rank: card.rank,
					name: card.name,
				});
			}
		}
		await Promise.all([ delCrate({ id }), createCollection(collectionBody) ]);
		const embed = createEmbed(author, client)
			.setTitle(`${emoji.crateopen} CRATE OPENED`)
			.setDescription(
				`You have opened **${crate.category.toUpperCase()}** Crate and received\n\n${cardsReceived
					.map(
						(ca) =>
							`• __${titleCase(ca.rank)}__ Level 1 **${titleCase(ca.name)}**`
					)
					.join("\n")}${orbs ? `\n• Blue Orbs __${orbs}__ ${emoji.blueorb}` : ""}`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.crates.openCrate: ERROR",
			err
		);
		return;
	}
}

export const crate = async ({ context, client, args, options }: BaseProps) => {
	try {
		const author = options.author;
		const cmd = args[0];
		const subcommand = filterSubCommands(cmd, subcommands);
		if (subcommand === "open") {
			args.shift();
			openCrate({
				context,
				client,
				args,
				options,
			});
			return;
		}
		const filter = clone(PAGE_FILTER);
		const params = fetchParamsFromArgs<{
      user_tag: string;
      category?: CrateCategoryProps;
	  page?: string[];
    }>(args);
		if (params.page && !isNaN(+params.page[0])) {
			filter.currentPage = Number(params.page[0] || 1);
			delete params.page;
		}
		Object.assign(params, { user_tag: author.id });
		let embed = createEmbed(author, client);
		let sentMessage: Message;
		const buttons = await paginatorInteraction(
			context.channel,
			author.id,
			params,
			filter,
			getCrates,
			(data, opts) => {
				if (data) {
					const list = createCrateList(
						data.data,
						data.metadata.currentPage,
						data.metadata.perPage
					);
					embed = createEmbedList({
						author,
						list,
						currentPage: data.metadata.currentPage,
						totalPages: data.metadata.totalPages,
						totalCount: data.metadata.totalCount,
						title: "Crates",
						description: "All the crates in your collections are shown below",
						pageName: "crates",
						pageCount: data.data.length,
						client,
					});
				} else {
					embed.setDescription("You do not have any crates. Participate in dungeon battles to earn more!");
				}
				if (opts?.isEdit) {
					sentMessage.editMessage(embed);
				}
				if (opts?.isDelete) {
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;

		embed.setButtons(buttons);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.crates.crate: ERROR",
			err
		);
		return;
	}
};
