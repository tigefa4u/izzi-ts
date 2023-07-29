import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { CharacterCanvasProps } from "@customTypes/canvas";
import { BaseProps } from "@customTypes/command";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import {
	deleteCollection,
	updateCollection,
} from "api/controllers/CollectionsController";
import { delFromMarket } from "api/controllers/MarketsController";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { delay } from "helpers";
import { createSingleCanvas } from "helpers/canvas";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	SACRIFICE_GOLD_COST,
} from "helpers/constants";
import { getReqSouls } from "helpers/evolution";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { getSortCache } from "../sorting/sortCache";

async function verifyAndProcessSacrifice(
	params: ConfirmationInteractionParams<{
    id: number;
    sacrificeId: number;
  }>,
	options?: ConfirmationInteractionOptions
) {
	const id = params.extras?.id;
	const sacrificeId = params.extras?.sacrificeId;
	if (!id || !sacrificeId || isNaN(id) || isNaN(sacrificeId)) return;
	const user = await getRPGUser({ user_tag: params.author.id });
	if (!user) return;
	const sort = await getSortCache(params.author.id);
	const [ _card, _cardToConsume ] = await Promise.all([
		getCardInfoByRowNumber({
			row_number: [ id ],
			user_id: user.id,
			user_tag: params.author.id,
		}, sort),
		getCardInfoByRowNumber({
			row_number: [ sacrificeId ],
			user_id: user.id,
			user_tag: params.author.id,
		}, sort)
	]);
	const card = (_card || [])[0];
	const cardToConsume = (_cardToConsume || [])[0];
	if (!card || !cardToConsume) {
		params.channel?.sendMessage(
			"We could not find the card you were looking for!"
		);
		return;
	}
	// if (cardToConsume.souls <= 0) {
	// 	params.channel?.sendMessage("The card you are trying to sacrifice must have atleast 1 soul! :x:");
	// 	return;
	// }
	const embed = createEmbed(params.author, params.client).setTitle(
		DEFAULT_ERROR_TITLE
	);
	if (card.rank_id >= 9) {
		embed.setDescription(
			"This card has already reached its max Evolution and cannot absorb souls!"
		);
		params.channel?.sendMessage(embed);
		return;
	} else if (card.rank_id < 4) {
		embed.setDescription("Your card must be of Diamond rank to absorb souls");
		params.channel?.sendMessage(embed);
		return;
	}
	const reqSouls = getReqSouls(card.rank_id);
	const cost = SACRIFICE_GOLD_COST;
	if (card.souls >= reqSouls) {
		embed.setDescription(
			"Your card already has the souls required to be used in Evolution. " +
        `Type \`\`evo ${id}\`\` to Evolve your card.`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (user.gold < cost) {
		embed.setDescription("You do not have enough gold to sacrifice your card!");
		params.channel?.sendMessage(embed);
		return;
	}
	if (card.rank_id !== cardToConsume.rank_id) {
		embed.setDescription("Both copies must be of same rank and max level");
		params.channel?.sendMessage(embed);
		return;
	}
	if (card.character_id !== cardToConsume.character_id) {
		embed.setDescription("You cannot use different cards in soul sacrifice");
		params.channel?.sendMessage(embed);
		return;
	}

	const cardCanvas = card;

	if (options?.isConfirm) {
		const powerLevel = await getPowerLevelByRank({ rank: card.rank });
		if (!powerLevel) {
			loggers.error("Power Level not found for rank: " + card.rank, {});
			params.channel?.sendMessage("Card sacrifice exited unexpectedly.");
			return;
		}
		if (
			card.character_level < powerLevel.max_level ||
      cardToConsume.character_level < powerLevel.max_level ||
      card.character_id !== cardToConsume.character_id
		) {
			embed.setDescription(
				`Both copies must be **Level __${powerLevel.max_level}__** before it can used in soul sacrifice!`
			);
			params.channel?.sendMessage(embed);
			return;
		}

		const promises = [];
		// delete card from market and team
		await delFromMarket({ collection_ids: [ cardToConsume.id ] }).then(async () => {
			loggers.info("Sacrifice card: ", {
				cardToConsume,
				upgradeCard: card
			});
			promises.push(
				deleteCollection({ id: cardToConsume.id }),
				updateCollection({ id: card.id }, { souls: reqSouls })
			);
		});
		user.gold = user.gold - cost;
		if (user.selected_card_id === cardToConsume.id) {
			user.selected_card_id = null;
		}
		promises.push(
			updateRPGUser(
				{ user_tag: user.user_tag },
				{
					gold: user.gold,
					selected_card_id: user.selected_card_id,
				}
			)
		);
		await Promise.all(promises);
		const canvas = await createSingleCanvas(cardCanvas, false);
		if (!canvas) {
			params.channel?.sendMessage(
				"Your card has absorbed souls! " +
          "but we were not able to display the information"
			);
			return;
		}
		const attachment = createAttachment(canvas.createJPEGStream(), "card.jpg");

		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Congratulations Summoner! Your __${titleCase(card.rank)}__ **Level ${
					card.character_level
				}** ${titleCase(
					card.name
				)} has successfully absorbed __${reqSouls}__ Souls!`
			)
			.attachFiles([ attachment ])
			.setThumbnail("attachment://card.jpg");

		params.channel?.sendMessage(embed);
		return;
	}

	return {
		card,
		cardToConsume,
		cardCanvas,
		cost,
		reqSouls,
	};
}

export const sacrificeCard = async ({
	context,
	args,
	options,
	client,
}: BaseProps) => {
	try {
		const author = options.author;
		const cooldownCommand = "sacrifice-card";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage(
				"You can use this command again after a minute."
			);
			return;
		}
		const id = Number(args.shift());
		const sacrificeId = Number(args.shift());
		if (!id || !sacrificeId || id === sacrificeId) return;
		const params = {
			client,
			author,
			channel: context.channel,
			extras: {
				id,
				sacrificeId,
			},
		};
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			verifyAndProcessSacrifice,
			async (data, opts) => {
				if (data) {
					// takes too long
					// const canvas = createSingleCanvas(data.cardCanvas, false);
					// if (!canvas) {
					// 	context.channel?.sendMessage(
					// 		"Unable to evolve this card, try again later"
					// 	);
					// 	throw new Error("Unable to create card canvas for confirmation");
					// }
					// const attachment = createAttachment(
					// 	canvas.createJPEGStream(),
					// 	"card.jpg"
					// );
					embed = createConfirmationEmbed(author, client)
						.setTitle(
							`${emoji.crossedswords} SOUL SACRIFICE ${emoji.crossedswords}`
						)
						.setDescription(
							`You are spending __${data.cost}__ Gold ${
								emoji.gold
							} and Consuming 1x __${titleCase(
								data.cardToConsume.rank
							)}__ **${titleCase(data.cardToConsume.name)}**, absorbing __${
								data.reqSouls
							}__ Souls to Evolve your __${titleCase(
								data.card.rank
							)}__ **Level ${data.card.character_level}** ${titleCase(
								data.card.name
							)}`
						);
					// .setThumbnail("attachment://card.jpg")
					// .attachFiles([ attachment ]);
				} else {
					embed.setDescription(
						"We cannot Sacrifice your card right now, please try again later."
					);
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;
		// await delay(2000); // wait till the canvas is prepared
		embed.setHideConsoleButtons(true);
		embed.setButtons(buttons);
		setCooldown(author.id, cooldownCommand);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.sacrifice.index.sacrificeCard: ERROR",
			err
		);
		return;
	}
};
