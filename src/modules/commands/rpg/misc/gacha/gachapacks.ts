import {
	AuthorProps,
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { CollectionCreateProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { getRandomCard } from "api/controllers/CardsController";
import { getRPGUser } from "api/controllers/UsersController";
import { startTransaction } from "api/models/Users";
import Cache from "cache";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client, Message } from "discord.js";
import emoji from "emojis/emoji";
import { numericWithComma, probability } from "helpers";
import { createBattleCanvas } from "helpers/canvas";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	DEFAULT_ERROR_TITLE,
	DOT,
	LEGENDARY_PACK_PITY_COUNT,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
} from "helpers/constants";
import { RankProps } from "helpers/helperTypes";
import { ranksMeta } from "helpers/rankConstants";
import loggers from "loggers";
import {
	clearCooldown,
	getCooldown,
	sendCommandCDResponse,
	setCooldown,
} from "modules/cooldowns";
import { titleCase } from "title-case";
import { clone } from "utility";
import { confirmationInteraction } from "utility/ButtonInteractions";

type P = {
  [k: string]: {
    ranks: RankProps[];
    chances: number[];
    cost: number;
    name: string;
  };
};
const packContains: P = {
	silver: {
		ranks: [
			ranksMeta.legend.name,
			ranksMeta.divine.name,
			ranksMeta.immortal.name,
		],
		chances: [ 40, 35, 25 ],
		cost: 120000,
		name: "Silver Pack",
	},
	epic: {
		ranks: [
			ranksMeta.divine.name,
			ranksMeta.immortal.name,
			ranksMeta.mythical.name,
		],
		chances: [ 100, 30, 1 ],
		// chances: [ 65, 30, 5 ],
		cost: 285000,
		name: "Epic Pack",
	},
	legendary: {
		ranks: [
			ranksMeta.divine.name,
			ranksMeta.immortal.name,
			ranksMeta.mythical.name,
		],
		// chances: [ 60, 30, 10 ], -> to show info
		chances: [ 100, 40, 2 ],
		cost: 400000,
		name: "Legendary Pack",
	},
};

const confirmAndPurchasePack = async (
	params: ConfirmationInteractionParams<{ pack: P[""]; showPity?: boolean }>,
	options?: ConfirmationInteractionOptions
) => {
	const pack = params.extras?.pack;
	if (!pack) return;
	const user = await getRPGUser({ user_tag: params.author.id });
	if (!user) return;
	const embed = createEmbed(params.author, params.client).setTitle(
		DEFAULT_ERROR_TITLE
	);
	if (user.gold < pack.cost) {
		embed.setDescription(
			`Summoner **${params.author.username}**, ` +
        `You do not have sufficient gold to purchase The ${pack.name}. ` +
        `Need __${numericWithComma(pack.cost)}__ Gold ${emoji.gold}`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		const result = (await Promise.all(
			Array(5)
				.fill("")
				.map(async (_) => {
					const rank = pack.ranks[probability(pack.chances)];
					const cards = await getRandomCard(
						{
							rank,
							is_random: true,
							is_event: false,
							is_world_boss: false,
						},
						1
					);
					if (!cards || cards.length <= 0) {
						return;
					}
					const card = cards[0];
					return {
						id: card.id,
						character_id: card.character_id,
						rank: card.rank,
						rank_id: ranksMeta[card.rank].rank_id,
						name: card.name,
						filepath: card.metadata?.assets?.small.filepath,
					};
				})
				.filter(Boolean)
		)) as {
      id: number;
      character_id: number;
      rank: RankProps;
      rank_id: number;
      name: string;
      filepath: string;
    }[];

		let canvas: any;

		try {
			const cards = clone(result)
				.slice(0, 3)
				.map((r) => ({
					...r,
					metadata: { assets: { small: { filepath: r.filepath } } },
				})) as any[];
			canvas = await createBattleCanvas(cards, {
				isSingleRow: true,
				version: "small",
			});
		} catch (err) {
			console.log(err);
		}
		if (pack.name === packContains["legendary"].name) {
			const key = `packpity-${params.author.id}`;
			const hasMythical = result.find(
				(r) => r.rank_id === ranksMeta.mythical.rank_id
			);
			if (hasMythical) {
				await Cache.del(key);
			} else {
				if (params.extras?.showPity) {
					result[0].rank = ranksMeta.mythical.name;
					result[0].rank_id = ranksMeta.mythical.rank_id;
					await Cache.del(key);
				} else {
					await Cache.incr(key);
				}
			}
		}

		const dataToInsert = result.map((r) => ({
			user_id: user.id,
			character_id: r.character_id,
			rank: r.rank,
			rank_id: r.rank_id,
			character_level: STARTER_CARD_LEVEL,
			exp: STARTER_CARD_EXP,
			r_exp: STARTER_CARD_R_EXP,
			is_item: false,
			is_tradable: true,
			card_count: 1,
		})) as CollectionCreateProps[];
		await startTransaction(async (trx) => {
			try {
				const updatedObj = await trx("users")
					.where({ id: user.id })
					.where("gold", ">=", pack.cost)
					.update({ gold: trx.raw(`gold - ${pack.cost}`) })
					.returning("*");
				if (!updatedObj || updatedObj.length <= 0) {
					throw new Error("Unable to updated user");
				}
				await trx("collections").insert(dataToInsert);
				embed
					.setTitle(`Purchased ${pack.name}`)
					.setThumbnail(result[result.length - 1].filepath)
					.setDescription(
						"You have successfully spent " +
              `__${numericWithComma(pack.cost)}__ Gold ${
              	emoji.gold
              } and received:\n\n` +
              `${result
              	.map(
              		(r) =>
              			`${DOT} __${titleCase(r.rank)}__ **${titleCase(r.name)}**`
              	)
              	.join("\n\n")}`
					);

				if (canvas) {
					const attachment = createAttachment(
						canvas.createJPEGStream(),
						"pack.jpeg"
					);
					embed.setImage("attachment://pack.jpeg").attachFiles([ attachment ]);
				}

				params.channel?.sendMessage(embed);
				return;
			} catch (err) {
				loggers.error(
					"gachapacks.confirmAndPurchasePack: TRANSACTION ERROR",
					err
				);
				embed.setDescription(
					`Summoner **${params.author.username}**, ` +
            `You do not have sufficient gold to purchase The ${pack.name}. ` +
            `Need __${numericWithComma(pack.cost)}__ Gold ${emoji.gold}`
				);
				params.channel?.sendMessage(embed);
				return;
			}
		});
		return;
	}
	return pack;
};

const createPackConfirmation = (
	author: AuthorProps,
	client: Client,
	data: P[""]
) => {
	return createConfirmationEmbed(author, client)
		.setTitle(`Purchasing ${data.name}`)
		.setDescription(
			"Are you sure you want to spend " +
        `__${numericWithComma(data.cost)}__ Gold ${
        	emoji.gold
        } to purchase The **${data.name}?**`
		)
		.setHideConsoleButtons(true);
};

export const silverPacks = async ({
	context,
	client,
	options,
}: BaseProps) => {
	try {
		const { author } = options;
		const pack = packContains.silver;
		const cmd = "gachapack";
		const cd = await getCooldown(author.id, cmd);
		if (cd) {
			sendCommandCDResponse(context.channel, cd, author.id, cmd);
			return;
		}
		let embed = createEmbed(author, client).setDescription("No data available");
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			{
				channel: context.channel,
				client,
				author,
				extras: { pack },
			},
			confirmAndPurchasePack,
			async (data, opts) => {
				if (data) {
					embed = createPackConfirmation(author, client, data);
				}
				if (opts?.isDelete) {
					await clearCooldown(author.id, cmd);
					sentMessage.deleteMessage();
				}
			}
		);

		if (!buttons) return;
		embed.setButtons(buttons);
		await setCooldown(author.id, cmd);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("gachapacks.silverPacks: ERROR", err);
		return;
	}
};

export const epicPack = async ({
	context,
	client,
	options,
}: BaseProps) => {
	try {
		const { author } = options;
		const pack = packContains.epic;
		const cmd = "gachapack";
		const cd = await getCooldown(author.id, cmd);
		if (cd) {
			sendCommandCDResponse(context.channel, cd, author.id, cmd);
			return;
		}
		let embed = createEmbed(author, client).setDescription("No data available");
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			{
				channel: context.channel,
				client,
				author,
				extras: { pack },
			},
			confirmAndPurchasePack,
			async (data, opts) => {
				if (data) {
					embed = createPackConfirmation(author, client, data);
				}
				if (opts?.isDelete) {
					await clearCooldown(author.id, cmd);
					sentMessage.deleteMessage();
				}
			}
		);

		if (!buttons) return;
		embed.setButtons(buttons);
		await setCooldown(author.id, cmd);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("gachapacks.epicPack: ERROR", err);
		return;
	}
};

export const legendaryPacks = async ({
	context,
	client,
	options,
}: BaseProps) => {
	try {
		const { author } = options;
		const pack = packContains.legendary;
		const cmd = "gachapack";
		const cd = await getCooldown(author.id, cmd);
		if (cd) {
			sendCommandCDResponse(context.channel, cd, author.id, cmd);
			return;
		}
		let embed = createEmbed(author, client).setDescription("No data available");
		let sentMessage: Message;
		const key = `packpity-${author.id}`;
		const pityCount = await Cache.get(key);
		let showPity = false;
		if (pityCount && Number(pityCount) >= LEGENDARY_PACK_PITY_COUNT) {
			showPity = true;
		}
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			{
				channel: context.channel,
				client,
				author,
				extras: {
					pack,
					showPity,
				},
			},
			confirmAndPurchasePack,
			async (data, opts) => {
				if (data) {
					embed = createPackConfirmation(author, client, data);
				}
				if (opts?.isDelete) {
					await clearCooldown(author.id, cmd);
					sentMessage.deleteMessage();
				}
			}
		);

		if (!buttons) return;
		embed.setButtons(buttons);
		await setCooldown(author.id, cmd);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("gachapacks.legendaryPacks: ERROR", err);
		return;
	}
};
