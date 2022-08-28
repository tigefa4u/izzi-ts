import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { PLProps } from "@customTypes/powerLevel";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import { updateCollection } from "api/controllers/CollectionsController";
import { getPowerLevelByRankId } from "api/controllers/PowerLevelController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	CHARACTER_LEVEL_EXTENDABLE_LIMIT,
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	ranksMeta,
} from "helpers/constants";
import { getReqSouls } from "helpers/evolution";
import loggers from "loggers";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";

const validateAndUpgradeCard = async (
	params: ConfirmationInteractionParams<{
    userId: number;
    id: number;
  }>,
	options?: ConfirmationInteractionOptions
) => {
	const { channel, client, author, extras } = params;
	const userId = extras?.userId;
	const id = extras?.id;
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
		card.rank_id !== ranksMeta.exclusive.rank_id &&
    card.rank_id !== ranksMeta.ultimate.rank_id
	) {
		embed.setDescription(
			"You can only increase the level of an Exclusive or Ultimate ranked card."
		);
		channel?.sendMessage(embed);
		return;
	}
	const powerLevel = await getPowerLevelByRankId({ rank_id: card.rank_id });
	if (!powerLevel) {
		loggers.error(
			"evolution.upgradeCard.validateAndUpgradeCard(): Power Level not found -> ",
			{
				rank: card.rank,
				id: card.id,
			}
		);
		channel?.sendMessage("Unable to level up, please contact support.");
		return;
	}
	if (powerLevel.max_level !== card.character_level) {
		embed.setDescription(
			"This card must be max level before you can increase its level further."
		);
		channel?.sendMessage(embed);
		return;
	}
	const reqSouls = getReqSouls(card.rank_id);
	const levelDifference = card.character_level - powerLevel.max_level;
	if (levelDifference > CHARACTER_LEVEL_EXTENDABLE_LIMIT) {
		embed.setDescription("Your card has already reached its max level.");
		channel?.sendMessage(embed);
		return;
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
		card.souls = 1;
		await updateCollection(
			{ id },
			{
				character_level: card.character_level,
				souls: card.souls,
			}
		);
		channel?.sendMessage(embed);
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
		let embed = createEmbed(author, client);
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
				},
			},
			validateAndUpgradeCard,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client).setDescription(
						`Are you sure you want to level up your **Level ${
							data.character_level
						}** __${titleCase(data.rank)}__ **${titleCase(
							data.name
						)}** to **__Level ${data.character_level + 1}**__`
					);
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
		loggers.error("evolution.upgradeCard.upgradeCard(): something went wrong", err);
		return;
	}
};
