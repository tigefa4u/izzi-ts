import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import { updateCollection } from "api/controllers/CollectionsController";
import { getPowerLevelByRankId } from "api/controllers/PowerLevelController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import transaction from "db/transaction";
import { Message } from "discord.js";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	CHARACTER_LEVEL_EXTENDABLE_LIMIT,
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	MAX_CONSUMABLE_SOULS,
} from "helpers/constants/constants";
import { getReqSouls } from "helpers/evolution";
import { ranksMeta } from "helpers/constants/rankConstants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";

const validateAndUpgradeCard = async (
	params: ConfirmationInteractionParams<{
    userId: number;
    id: number;
	isConsumeSouls: boolean;
	soulsToConsume: number;
  }>,
	options?: ConfirmationInteractionOptions
) => {
	const { channel, client, author, extras } = params;
	const userId = extras?.userId;
	const id = extras?.id;
	const isConsumeSouls = params.extras?.isConsumeSouls;
	const soulsToConsume = params.extras?.soulsToConsume;
	if (!userId || !id) return;
	const collectionResult = await getCollectionById({
		id,
		user_id: userId,
	});
	const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
	if (!collectionResult || collectionResult.length <= 0) {
		embed.setDescription(
			"We could not find the ID you were looking for in your inventory"
		);
		channel?.sendMessage(embed);
		return;
	}
	const card = collectionResult[0];
	if (
		card.rank_id !== ranksMeta.ultimate.rank_id &&
	card.rank_id !== ranksMeta.mythical.rank_id
	) {
		let text = "You can only increase the level of an Ultimate / Mythical ranked card.";
		if (isConsumeSouls) {
			text = "Your card must be Ultimate / Mythical rank before it can consume souls.";
		}
		embed.setDescription(
			text
		);
		channel?.sendMessage(embed);
		return;
	}
	const powerLevel = await getPowerLevelByRankId({ rank_id: card.rank_id });
	if (!powerLevel) {
		loggers.error(
			"evolution.upgradeCard.validateAndUpgradeCard: Power Level not found -> ",
			{
				rank: card.rank,
				id: card.id,
			}
		);
		channel?.sendMessage(`Unable to ${isConsumeSouls ? "consume souls" : "level up"}, please contact support.`);
		return;
	}
	const maxUpgradableLevel = powerLevel.max_level + CHARACTER_LEVEL_EXTENDABLE_LIMIT;
	if (card.character_level < powerLevel.max_level) {
		embed.setDescription(
			"This card must be max level before you can increase its level further."
		);
		channel?.sendMessage(embed);
		return;
	} else if (card.character_level >= maxUpgradableLevel) {
		embed.setDescription(
			"Your card has already reached max upgradable level " +
			`__${maxUpgradableLevel}__ and can no longer consume souls.`
		);
		channel?.sendMessage(embed);
		return;
	}
	const reqSouls = getReqSouls(card.rank_id);
	const levelDifference = card.character_level - powerLevel.max_level;
	if (levelDifference >= CHARACTER_LEVEL_EXTENDABLE_LIMIT) {
		embed.setDescription("Your card has already reached its max level.");
		channel?.sendMessage(embed);
		return;
	}
	if (isConsumeSouls) {
		if (!soulsToConsume) return;
		if (options?.isConfirm) {
			embed.setTitle(DEFAULT_SUCCESS_TITLE)
				.setDescription(`Your **Level ${card.character_level}** __${titleCase(card.rank)}__ **${titleCase(
					card.name
				)}** has successfully consumed __${soulsToConsume}__ Souls!`);

			const user = await getRPGUser({ user_tag: author.id });
			if (!user) return;
			if (user.souls < soulsToConsume) {
				embed.setTitle(DEFAULT_ERROR_TITLE)
					.setDescription("You do not have sufficient souls to consume.");

				params.channel?.sendMessage(embed);
				return;
			}
			user.souls = user.souls - soulsToConsume;
			await Promise.all([
				updateCollection({ id: card.id }, { souls: card.souls + soulsToConsume }),
				updateRPGUser({ user_tag: author.id }, { souls: user.souls })
			]);
			params.channel?.sendMessage(embed);
			return;
		}
		return card;
	}
	const extraSouls = Math.ceil(levelDifference ** 1.57);
	const totalSouls = reqSouls + extraSouls;
	if (card.souls < totalSouls) {
		embed.setDescription(
			`Your card does not have sufficient souls to increase its level **__[${card.souls} / ${totalSouls}]__**`
		);
		channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`You have successfully leveled up your **Level ${
					card.character_level
				}** __${titleCase(card.rank)}__ **${titleCase(
					card.name
				)}** to **__Level ${card.character_level + 1}__**`
			);
		card.character_level = card.character_level + 1;
		card.souls =  card.souls - totalSouls;
		if (card.souls < 0) card.souls = 0;
		await transaction(async (trx) => {
			try {
				loggers.info("upgradeCard: transaction started for card: " + id);
				const updatedObj = await trx.raw(
					`update collections set character_level = character_level + 1, souls = souls - ${totalSouls} 
					where id = ${id} returning id, character_level, souls`
				);
				if (!updatedObj) {
					throw "Unable to update";
				}
				loggers.info("upgradeCard: successfully upgraded card - ", updatedObj);
				channel?.sendMessage(embed);
				return trx.commit();
			} catch (err) {
				loggers.error("upgradeCard: unable to upgrade: ", err);
				channel?.sendMessage("Something went wrong while upgrading card. Please try again :x:");
				return trx.rollback();
			}
		});
		// await updateCollection(
		// 	{ id },
		// 	{
		// 		character_level: card.character_level,
		// 		souls: card.souls,
		// 	}
		// );
		// channel?.sendMessage(embed);
		return;
	}
	return card;
};

export const upgradeCard = async ({
	context,
	client,
	options,
	args,
}: BaseProps) => {
	try {
		const author = options.author;
		const id = Number(args.shift());
		if (isNaN(id)) return;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const soulsToConsume = Number(args.shift());
		let embed = createEmbed(author, client);
		let isConsumeSouls = false;
		if (!isNaN(soulsToConsume) && soulsToConsume > 0) {
			if (soulsToConsume > MAX_CONSUMABLE_SOULS) {
				embed.setTitle(DEFAULT_ERROR_TITLE)
					.setDescription(`Summoner **${author.username}**, ` +
					`you cannot consume more than __${MAX_CONSUMABLE_SOULS}__ Souls.`);
			
				context.channel?.sendMessage(embed);
				return;
			}
			if (user.souls < soulsToConsume) {
				embed.setTitle(DEFAULT_ERROR_TITLE)
					.setDescription(`Summoner **${author.username}**, You do not have ` +
					`sufficient souls in your inventory **[ __${user.souls}__ ]**.`);

				context.channel?.sendMessage(embed);
				return;
			}
			isConsumeSouls = true;
		}
		let sentMessage: Message;

		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			{
				channel: context.channel,
				client,
				author,
				extras: {
					id,
					userId: user.id,
					isConsumeSouls,
					soulsToConsume
				},
			},
			validateAndUpgradeCard,
			(data, opts) => {
				if (data) {
					let text = `Are you sure you want to level up your **Level ${
						data.character_level
					}** __${titleCase(data.rank)}__ **${titleCase(
						data.name
					)}** to **__Level ${data.character_level + 1}__**`;

					if (isConsumeSouls) {
						text = `Are you sure you want to consume __${soulsToConsume}__ Souls?`;
					}
					embed = createConfirmationEmbed(author, client).setDescription(
						text
					);
				}
				if (opts?.isDelete) {
					sentMessage.deleteMessage();
				}
			}
		);

		if (!buttons) return;
		embed.setHideConsoleButtons(true);
		embed.setButtons(buttons);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("evolution.upgradeCard.upgradeCard: ERROR", err);
		return;
	}
};
