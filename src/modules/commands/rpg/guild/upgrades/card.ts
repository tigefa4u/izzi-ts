import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getCharacterInfo } from "api/controllers/CharactersController";
import {
	getCollection,
	updateCollection,
} from "api/controllers/CollectionsController";
import {
	delGuildItems,
	getAllGuildItems,
	updateGuildItem,
} from "api/controllers/GuildItemsController";
import { updateGuildMember } from "api/controllers/GuildMembersController";
import { updateGuild } from "api/controllers/GuildsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_SUCCESS_TITLE,
	GUILD_ITEM_PROPERTIES,
	GUILD_MARKET_IDS,
	SEAL_ID,
	SOUL_ID,
} from "helpers/constants";
import { getReqSouls } from "helpers/evolution";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { verifyMemberPermissions } from "..";

async function validateAndUpgradeCard(
	params: ConfirmationInteractionParams<{
    context: BaseProps["context"];
    user_id: number;
    collection_id: number;
    numOfSouls: number;
  }>,
	options?: ConfirmationInteractionOptions
) {
	const context = params.extras?.context;
	if (!context || !params.extras?.user_id || !params.extras.collection_id)
		return;

	const validGuild = await verifyMemberPermissions({
		context: context,
		author: params.author,
		params: [],
		isOriginServer: true,
		isAdmin: false,
		extras: { user_id: params.extras.user_id },
	});
	if (!validGuild) return;
	const embed = createEmbed(params.author, params.client).setTitle(
		DEFAULT_ERROR_TITLE
	);
	const collection = await getCollection({
		id: params.extras.collection_id,
		user_id: params.extras.user_id,
	});
	if (!collection || !collection[0]) {
		embed.setDescription(
			"We could not find the card you were looking for in your inventory"
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (!collection[0].is_tradable) {
		embed.setDescription(
			"You cannot absorb guild souls into non tradable cards. " +
			"You can gain souls by sacrificing a card. Use ``@izzi help sac`` for more info"
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const guilditems = await getAllGuildItems(
		{
			guild_id: validGuild.guild.id,
			ids: GUILD_MARKET_IDS,
		},
		{
			currentPage: 1,
			perPage: 2,
		}
	);
	const souls = guilditems?.data.filter((it) => it.item_id === SOUL_ID)[0];
	const seals = guilditems?.data.filter((it) => it.item_id === SEAL_ID)[0];
	if (!souls || !seals) {
		context.channel?.sendMessage(
			"Your guild does not have sufficient **Souls** or **Seals**"
		);
		return;
	}
	if (souls.quantity < params.extras.numOfSouls) {
		context.channel?.sendMessage(
			"Your guild does not have sufficient Souls to upgrade your card! " +
        `**[${souls.quantity}/${params.extras.numOfSouls}]** :x:`
		);
		return;
	}
	const reqSeals = Math.ceil(params.extras.numOfSouls / 5);
	if (seals.quantity < reqSeals) {
		context.channel?.sendMessage(
			`Your guild does not have sufficient Seals to upgrade your card! **[${seals.quantity}/${reqSeals}]** :x:`
		);
		return;
	}
	const missingItems = guilditems?.data.reduce((acc: string[], r) => {
		if (!GUILD_MARKET_IDS.includes(r.item_id)) {
			let missingItem = "";
			if (SOUL_ID === r.item_id) {
				missingItem = GUILD_ITEM_PROPERTIES.SOUL_ID;
			} else {
				missingItem = GUILD_ITEM_PROPERTIES.SEAL_ID;
			}
			acc.push(missingItem);
		}
		return acc;
	}, []);

	if ((missingItems || []).length > 0) {
		embed.setDescription(
			`The following items are required to harvest souls!\n\n${missingItems
				?.map((i) => `**__${titleCase(i)}__**`)
				.join("\n")}`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const totalCost =
    souls.price * params.extras.numOfSouls + seals.price * reqSeals;
	if (validGuild.member.donation < totalCost) {
		embed.setDescription(
			"You do not have enough contribution to your guild to use this item! " +
        "you can donate more to your guild to be able to access more items!"
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const cardToEvolve = collection[0];
	if (cardToEvolve.rank_id >= 9) {
		embed.setDescription("This card has already reached its max Evolution!");
		params.channel?.sendMessage(embed);
		return;
	} else if (cardToEvolve.rank_id < 4) {
		embed.setDescription(
			"Your card must be of Diamond rank to be able to be able to absorb souls!"
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const reqSouls = getReqSouls(cardToEvolve.rank_id);

	if (cardToEvolve.souls >= reqSouls) {
		embed.setDescription(
			`You have already absorbed the required souls **__${cardToEvolve.souls}__**, ` +
        "use ``evo #ID`` to use this card in Evolution!"
		);
		params.channel?.sendMessage(embed);
		return;
	}

	const totalSouls = cardToEvolve.souls + params.extras.numOfSouls;
	if (totalSouls > reqSouls) {
		embed.setDescription(
			`You are trying to consume more souls than required **[${totalSouls} / ${reqSouls}]**. ` +
        "Please re-check the number of souls you want to consume."
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		souls.quantity = souls.quantity - params.extras.numOfSouls;
		if (souls.quantity <= 0) {
			await delGuildItems({
				id: souls.id,
				guild_id: validGuild.guild.id,
			});
		} else {
			await updateGuildItem({ id: souls.id }, { quantity: souls.quantity });
		}
		seals.quantity = seals.quantity - reqSeals;
		if (seals.quantity <= 0) {
			await delGuildItems({
				id: seals.id,
				guild_id: validGuild.guild.id,
			});
		} else {
			await updateGuildItem({ id: seals.id }, { quantity: seals.quantity });
		}
		const card = collection[0];
		card.souls = card.souls + params.extras.numOfSouls;
		validGuild.member.donation = validGuild.member.donation - totalCost;
		validGuild.guild.gold = validGuild.guild.gold + Math.floor(totalCost * 0.1);
		await Promise.all([
			updateGuild({ id: validGuild.guild.id }, { gold: validGuild.guild.gold }),
			updateGuildMember(
				{ id: validGuild.member.id },
				{ donation: validGuild.member.donation }
			),
			updateCollection({ id: card.id }, { souls: card.souls }),
		]);

		const charaInfo = await getCharacterInfo({
			rank: card.rank,
			ids: [ card.character_id ],
		});
		if (!charaInfo || charaInfo.length <= 0) {
			params.channel?.sendMessage(
				"You have successfully absorbed souls! You are one of the few who failed to receive a success message"
			);
			return;
		}
		const characterInfo = charaInfo[0];
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setThumbnail(characterInfo.filepath)
			.setDescription(
				`Congratulations ${params.author.username}! Your __${titleCase(
					card.rank
				)}__ **Level ${card.character_level}** ${titleCase(
					characterInfo.name
				)} has successfully absorbed __${params.extras.numOfSouls}__ souls`
			);
		params.channel?.sendMessage(embed);
		return;
	}

	return {
		reqSeals,
		numOfSouls: params.extras.numOfSouls,
	};
}

export const upgradeCard = async ({
	context,
	client,
	options,
	args,
}: BaseProps) => {
	try {
		const author = options.author;
		const cooldownCommand = "upgrade-card";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage(
				"You can use this command again after a minute."
			);
			return;
		}
		const collectionId = Number(args.shift());
		if (!collectionId || isNaN(collectionId)) return;
		let numOfSouls = Number(args.shift());
		if (isNaN(numOfSouls) || numOfSouls <= 0 || numOfSouls > 20) numOfSouls = 1;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		let embed = createEmbed(author, client);
		let sentMessage: Message;
		const params = {
			channel: context.channel,
			author,
			client,
			extras: {
				context,
				user_id: user.id,
				collection_id: collectionId,
				numOfSouls,
			},
		};
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			validateAndUpgradeCard,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client).setDescription(
						`Are you sure you want to absorb __${data.numOfSouls}__ Souls ` +
              `using ${data.reqSeals} Dark Seals?`
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
		setCooldown(author.id, cooldownCommand);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.upgrades.upgradeCard: ERROR",
			err
		);
		return;
	}
};
