import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getCardInfoByRowNumber, } from "api/controllers/CollectionInfoController";
import { getRPGUser } from "api/controllers/UsersController";
import { startTransaction } from "api/models/Users";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { createSingleCanvas } from "helpers/canvas";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
} from "helpers/constants/constants";
import { MASTERY_TITLE, ranksMeta } from "helpers/constants/rankConstants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";
// import { fetchParamsFromArgs } from "utility/forParams";

const confirmAndMasterCard = async (
	params: ConfirmationInteractionParams<{
    userId: number;
    cidArr: number[];
    cardId: number;
  }>,
	options?: ConfirmationInteractionOptions
) => {
	const { author, client } = params;
	const cidArr = params.extras?.cidArr;
	const userId = params.extras?.userId;
	const cardId = params.extras?.cardId;
	if (!cidArr || !userId || !cardId) return;
	const [ cardsToConsume, cards ] = await Promise.all([
		getCardInfoByRowNumber({
			row_number: cidArr,
			user_id: userId,
		}),
		getCardInfoByRowNumber({
			row_number: cardId,
			user_id: userId,
		})
	]);
	const cardToMaster = (cards || [])[0];
	const embed = createEmbed(author, client)
		.setTitle(DEFAULT_ERROR_TITLE)
		.setHideConsoleButtons(true);
	if (!cardToMaster || !cardsToConsume || cardsToConsume.length <= 0) {
		embed.setDescription(
			"We could not find the card you were looking for in your inventory."
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if ((cardToMaster.rank_division || 0) >= 2) {
		embed.setDescription(
			"Your card has received as Mastery Title. " +
            `Use \`iz info ${cardId}\` to view card info and Mastery Title.`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const onMarket = cardsToConsume.filter(
		(c) => c.is_on_market === true
	);
	if (onMarket.length > 0) {
		embed.setDescription(
			"One or more cards you are trying to sacrifice is on the Global Market. " +
        "Please remove them from the Global Market to be able to " +
        `consume them in Mastery (${onMarket.map((m) => m.id).join(", ")}).`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (!cardToMaster || cardsToConsume.length < 3) {
		embed.setDescription(
			"You do not have sufficient cards to Master this card."
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (
		cardToMaster.rank_id !== ranksMeta.mythical.rank_id ||
    cardToMaster.character_level < (ranksMeta.mythical.max_level || 70)
	) {
		embed.setDescription(
			"Your card must be of Mythical Rank and max level (70+) to be eligible for Mastery."
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const isNotMyth = cardsToConsume.find(
		(c) =>
			c.rank_id !== ranksMeta.mythical.rank_id ||
      c.character_level < (ranksMeta.mythical.max_level || 70)
	);
	if (isNotMyth) {
		embed.setDescription(
			"All cards must be of Mythical rank and level __70__ to be able to be used in Mastery. " +
        "The card you want to master can be level 70+."
		);
		params.channel?.sendMessage(embed);
		return;
	}
	loggers.info("masterCard: Mastering card: ", cardToMaster);
	loggers.info("masterCard: Sacrificing cards:", cardsToConsume);

	const canvas = await createSingleCanvas(cardToMaster, false, "small");
	if (options?.isConfirm) {
		loggers.info("masterCard: confirmed");
		cardToMaster.rank_division = (cardToMaster.rank_division || 1) + 1;
		const extraSouls = cardsToConsume.reduce((acc, r) => {
			if (r.souls > 1) return acc + r.souls;
			return 0;
		}, 0);
		cardToMaster.souls = cardToMaster.souls + extraSouls;
		// Using transactions because its sensitive data
		// await Promise.all([
		// 	updateCollection({ id: cardToMaster.id }, {
		// 		souls: cardToMaster.souls,
		// 		rank_division: cardToMaster.rank_division
		// 	}),
		// 	deleteCollection({ ids: cardsToConsume.map((c) => c.id) })
		// ]);

		await startTransaction(async (trx) => {
			try {
				loggers.info("masterCard: transaction started");
				const updatedObj = await trx("collections")
					.where({
						id: cardToMaster.id,
						user_id: userId,
					})
					.update({
						souls: cardToMaster.souls,
						rank_division: cardToMaster.rank_division,
					})
					.returning("id");

				if (!updatedObj) {
					throw new Error("Unable to Master card");
				}
				await trx("collections")
					.whereIn(
						"id",
						cardsToConsume.map((c) => c.id)
					)
					.where({ user_id: userId })
					.del();

				loggers.info("masterCard: transaction completed");
			} catch (err) {
				loggers.error("masterCard: transaction ERROR", err);
				params.channel?.sendMessage(
					"An Error occured during Mastery. Please try again, " +
            "if the issue persists please contact support."
				);
				return;
			}
		});
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Congratulations Summoner, Your **Level ${
					cardToMaster.character_level
				}** __${titleCase(cardToMaster.rank)}__ **${titleCase(
					cardToMaster.name
				)}** has received the **${
					MASTERY_TITLE[cardToMaster.rank_division].name
				} ${MASTERY_TITLE[cardToMaster.rank_division].emoji}** Mastery Title.`
			);

		if (canvas) {
			const attachment = createAttachment(
				canvas.createJPEGStream(),
				"master.jpg"
			);
			embed.setThumbnail("attachment://master.jpg").attachFiles([ attachment ]);
		}

		params.channel?.sendMessage(embed);
		return;
	}
	return {
		cardToMaster,
		cardsToConsume,
		canvas,
	};
};

export const masterCard = async ({
	context,
	client,
	args,
	options,
}: BaseProps) => {
	try {
		const { author } = options;
		// const params = fetchParamsFromArgs(args);
		const cardId = parseInt(args.shift() || "0");
		if (isNaN(cardId) || cardId <= 0) {
			context.channel?.sendMessage(
				"We could not find the card you were looking for in your inventory."
			);
			return;
		}
		const sacIds = args.shift();
		if (!sacIds) return;
		const cidArr = [ ...sacIds.split(",").map((s) => parseInt(s)) ].slice(
			0,
			3
		);
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		let embed = createEmbed(author, client)
			.setHideConsoleButtons(true)
			.setDescription("No data available");
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			{
				client,
				author,
				channel: context.channel,
				extras: {
					userId: user.id,
					cidArr,
					cardId,
				},
			},
			confirmAndMasterCard,
			(data, opts) => {
				if (data) {
					const mastery = MASTERY_TITLE[(data.cardToMaster.rank_division || 1) + 1];
					embed = createConfirmationEmbed(author, client)
						.setHideConsoleButtons(true)
						.setDescription(
							`Are you sure you want consume ${data.cardsToConsume.map((c) =>
								`**Level ${c.character_level}** __${titleCase(c.rank)}__ **${titleCase(c.name)}**`
							).join(", ")} and receive the **${mastery.name} ${mastery.emoji}** Mastery Title?`
						);

					if (data.canvas) {
						const attachment = createAttachment(
							data.canvas.createJPEGStream(),
							"master.jpg"
						);
						embed
							.setThumbnail("attachment://master.jpg")
							.attachFiles([ attachment ]);
					}
				}
				if (opts?.isDelete) {
					sentMessage.deleteMessage();
				}
				return;
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
		loggers.error("guildEvents.actions.masterCard: ERROR", err);
		return;
	}
};
