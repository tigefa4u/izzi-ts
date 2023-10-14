import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import {
	getCardInfoByRowNumber,
	getCollectionById,
} from "api/controllers/CollectionInfoController";
import { updateCollection } from "api/controllers/CollectionsController";
import {
	getPowerLevelByRank,
	getPowerLevelByRankId,
} from "api/controllers/PowerLevelController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { startTransaction } from "api/models/Users";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { OWNER_DISCORDID } from "environment";
import { numericWithComma } from "helpers";
import { createSingleCanvas } from "helpers/canvas";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	CHARACTER_LEVEL_EXTENDABLE_LIMIT,
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	STARTER_CARD_EXP,
	STARTER_CARD_R_EXP,
} from "helpers/constants/constants";
import { DMUser } from "helpers/directMessages";
import { getReqSouls } from "helpers/evolution";
import { ranksMeta } from "helpers/constants/rankConstants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { getSortCache } from "../sorting/sortCache";

async function verifyAndProcessEvolution(
	params: ConfirmationInteractionParams<{
    id: number;
    isFromButtonSource: boolean;
  }>,
	options?: ConfirmationInteractionOptions
) {
	const id = params.extras?.id;
	if (!id || isNaN(id)) return;
	const user = await getRPGUser({ user_tag: params.author.id });
	if (!user) return;
	const sort = await getSortCache(params.author.id);
	let collection;
	if (params.extras?.isFromButtonSource) {
		collection = await getCollectionById({
			id: id,
			user_id: user.id,
		});
	} else {
		collection = await getCardInfoByRowNumber(
			{
				row_number: id,
				user_id: user.id,
				user_tag: params.author.id,
			},
			sort
		);
	}
	const embed = createEmbed(params.author, params.client).setTitle(
		DEFAULT_ERROR_TITLE
	);
	if (!collection || collection.length <= 0) {
		embed.setDescription("We could not find the card you were looking for.");
		params.channel?.sendMessage(embed);
		return;
	}
	const cardToEvolve = collection[0];
	if (cardToEvolve.rank_id >= ranksMeta.mythical.rank_id) {
		embed.setDescription("This card has already reached its max Evolution!");
		params.channel?.sendMessage(embed);
		return;
	} else if (cardToEvolve.rank_id < ranksMeta.diamond.rank_id) {
		embed.setDescription(
			"Your card must be of Diamond rank to be able to be used in evolution!"
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const powerLevel = await getPowerLevelByRank({ rank: cardToEvolve.rank });
	if (!powerLevel) return;
	if (cardToEvolve.character_level < powerLevel.max_level) {
		embed.setDescription(
			`Your card must be **Level __${powerLevel.max_level}__** before it can be used in Evolution!`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const extendedLevel = powerLevel.max_level + CHARACTER_LEVEL_EXTENDABLE_LIMIT;
	if (cardToEvolve.character_level > powerLevel.max_level && cardToEvolve.character_level < extendedLevel) {
		embed.setDescription(
			`Your card must be **Level __${extendedLevel}__** before it can be used in Evolution!`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const reqSouls = getReqSouls(cardToEvolve.rank_id);
	const cost = reqSouls * 100;
	if (user.gold < cost) {
		embed.setDescription(
			"You do not have sufficient gold to evolve your card!"
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const cardCanvas = cardToEvolve;
	if (cardToEvolve.souls < reqSouls) {
		embed.setDescription(
			`You do not have sufficient souls to evolve this card! **[${cardToEvolve.souls}/${reqSouls}]**`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		const newRankPL = await getPowerLevelByRankId({ rank_id: cardToEvolve.rank_id + 1, });
		if (!newRankPL) {
			throw new Error(
				"Failed to fetch Power Level for RANK ID: " + cardToEvolve.rank_id
			);
		}
		loggers.info("Evolving card:", {
			cardToEvolve,
			toRank: newRankPL.rank,
			rankId: newRankPL.rank_id,
		});
		cardToEvolve.rank_id = cardToEvolve.rank_id + 1;
		const prevRank = cardToEvolve.rank;
		cardToEvolve.rank = newRankPL.rank;
		user.gold = user.gold - cost;
		cardToEvolve.souls = cardToEvolve.souls - reqSouls;
		loggers.info("Evolving card: after data update -> ", cardToEvolve);
		const promises = [
			updateRPGUser({ user_tag: user.user_tag }, { gold: user.gold }),
			updateCollection(
				{ id: cardToEvolve.id },
				{
					rank: cardToEvolve.rank,
					rank_id: cardToEvolve.rank_id,
					souls: cardToEvolve.souls,
					character_level: 1,
					exp: STARTER_CARD_EXP,
					r_exp: STARTER_CARD_R_EXP,
				}
			),
		];

		await Promise.all(promises);
		const canvas = await createSingleCanvas(cardCanvas, false);
		if (!canvas) {
			params.channel?.sendMessage(
				"Your card has Evolved! " +
          "but we were not able to display the information"
			);
			return;
		}
		const attachment = createAttachment(canvas.createJPEGStream(), "card.jpg");
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Congratulations Summoner! You have successfully evolved your __${titleCase(
					prevRank
				)}__ **Level ${cardToEvolve.character_level}** ${titleCase(
					cardToEvolve.name
				)} to __${titleCase(newRankPL.rank)}__ rank!`
			)
			.attachFiles([ attachment ])
			.setThumbnail("attachment://card.jpg");

		params.channel?.sendMessage(embed);

		if (OWNER_DISCORDID) {
			await Promise.all([
				startTransaction(async (trx) => {
					try {
						await trx("users")
							.where({ user_tag: OWNER_DISCORDID })
							.update({ gold: trx.raw(`gold + ${cost}`) });
						return;
					} catch (err) {
						loggers.error("evolution.treasury: transaction failed", err);
						return;
					}
				}),
				DMUser(
					params.client,
					`Gold added to treasury from EVO - cost: ${numericWithComma(cost)} ${
						emoji.gold
					}`,
					OWNER_DISCORDID
				),
			]);
		}
		return;
	}
	return {
		cardToEvolve,
		cost,
		reqSouls,
		cardCanvas,
	};
}

export const evolveCard = async ({
	context,
	client,
	options,
	args,
}: BaseProps) => {
	try {
		const isFromButtonSource = options.extras?.isFromButtonSource || false;
		const author = options.author;
		const cooldownCommand = "evolve-card";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage(
				"You can use this command again after a minute."
			);
			return;
		}
		const id = Number(args.shift());
		if (!id) return;
		const params = {
			client,
			author,
			channel: context.channel,
			extras: {
				id,
				isFromButtonSource,
			},
		};
		let embed = createEmbed(author);
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			verifyAndProcessEvolution,
			async (data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client)
						.setTitle(
							`${emoji.crossedswords} SOUL SACRIFICE ${emoji.crossedswords}`
						)
						.setDescription(
							`You are spending __${data.cost}__ Gold ${
								emoji.gold
							} and Consuming all souls to Evolve your __${titleCase(
								data.cardToEvolve.rank
							)}__ **Level ${data.cardToEvolve.character_level}** ${titleCase(
								data.cardToEvolve.name
							)}\n\n**__${data.reqSouls}__ Souls**`
						);
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;

		embed.setHideConsoleButtons(true);
		embed.setButtons(buttons);
		setCooldown(author.id, cooldownCommand, 60);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.evolution.index.evolveCard: ERROR",
			err
		);
		return;
	}
};
