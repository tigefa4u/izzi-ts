import {
	ConfirmationInteractionOptions,
	ConfirmationInteractionParams,
} from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { GuildStatProps } from "@customTypes/guilds";
import {
	delGuildItems,
	getAllGuildItems,
	updateGuildItem,
} from "api/controllers/GuildItemsController";
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
	GUILD_MAX_LEVEL,
	GUILD_MIN_LEVEL_FOR_ITEM_BONUS,
	SEAL_ID,
	SOUL_ID,
} from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { isEmptyValue } from "utility";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { verifyMemberPermissions } from "..";

async function validateAndUpgradeGuild(
	params: ConfirmationInteractionParams<{
    context: BaseProps["context"];
    user_id: number;
  }>,
	options?: ConfirmationInteractionOptions
) {
	const context = params.extras?.context;
	if (!params.extras?.user_id || !context) return;
	const validGuild = await verifyMemberPermissions({
		context: context,
		author: params.author,
		params: [ "is_leader", "is_vice_leader" ],
		isOriginServer: true,
		isAdmin: true,
		extras: { user_id: params.extras.user_id },
	});
	if (!validGuild) return;
	if (validGuild.guild.guild_level >= GUILD_MAX_LEVEL) {
		context.channel?.sendMessage(
			"Your guild has already reached the maximum level in the Xenverse!"
		);
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

	const embed = createEmbed(params.author, params.client).setTitle(
		DEFAULT_ERROR_TITLE
	);
	if ((missingItems || []).length > 0) {
		embed.setDescription(
			`The following items are required to harvest souls!\n\n${missingItems
				?.map((i) => `**__${titleCase(i)}__**`)
				.join("\n")}`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (!souls || !seals) {
		embed.setDescription(
			"Your guild does not have enough **Souls** or **Dark Seals**. " +
			"Use ``guild mk`` to purchase items from the Guild Market"
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const reqSouls = validGuild.guild.guild_level * 3;
	if (souls.quantity < reqSouls) {
		embed.setDescription(
			`You do not have sufficient souls to evolve your guild __${souls.quantity}/${reqSouls}__ souls`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const reqSeals = Math.ceil(reqSouls / 5);
	if (seals.quantity < reqSeals) {
		embed.setDescription(
			`You do not have sufficient Dark Seal to harvest souls __${seals.quantity}/${reqSeals}__ seals`
		);
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		souls.quantity = souls.quantity - reqSouls;
		seals.quantity = seals.quantity - reqSeals;
		if (souls.quantity <= 0) {
			await delGuildItems({
				guild_id: validGuild.guild.id,
				id: souls.id,
			});
		} else {
			await updateGuildItem({ id: souls.id }, { quantity: souls.quantity });
		}
		if (seals.quantity <= 0) {
			await delGuildItems({
				guild_id: validGuild.guild.id,
				id: seals.id,
			});
		} else {
			await updateGuildItem({ id: seals.id }, { quantity: seals.quantity });
		}
		validGuild.guild.guild_level = validGuild.guild.guild_level + 1;
		const updateObj = { guild_level: validGuild.guild.guild_level };

		if (validGuild.guild.guild_level > GUILD_MIN_LEVEL_FOR_ITEM_BONUS) {
			if (isEmptyValue(validGuild.guild.item_stats || {})) {
				Object.assign(updateObj, {
					item_stats: {
						vitality: 0.05,
						defense: 0.06,
						intelligence: 0.03,
						strength: 0.12,
						dexterity: 0.07,
					},
				});
			} else {
				const itemStats = validGuild.guild.item_stats;
				if (!itemStats) return;
				Object.keys(itemStats).forEach((stat) => {
					const incVal = itemStats[stat as keyof GuildStatProps] + 0.05;
					Object.assign(itemStats, { [stat]: Math.round((incVal + Number.EPSILON) * 100) / 100, });
				});
				Object.assign(updateObj, { item_stats: itemStats });
			}
		}

		if (validGuild.guild.guild_level % 8 === 0) {
			validGuild.guild.max_members = validGuild.guild.max_members + 1;
			Object.assign(updateObj, { max_members: validGuild.guild.max_members });
		}
		const stats = validGuild.guild.guild_stats;
		if (!stats) return;
		Object.keys(stats).forEach((stat) => {
			const incVal = stats[stat as keyof GuildStatProps] + 0.15;
			Object.assign(stats, { [stat]: Math.round((incVal + Number.EPSILON) * 100) / 100, });
		});
		Object.assign(updateObj, { guild_stats: stats });
		await updateGuild({ id: validGuild.guild.id }, updateObj);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Congratulations Summoner! you have successfully consumed __${reqSouls}__ souls ` +
          `and __${reqSeals}__ seals and increased your guild level to ` +
          `**level __${validGuild.guild.guild_level}__** ` +
          "as well as increasing its bonus stats!"
			);

		params.channel?.sendMessage(embed);
		return;
	}
	return {
		reqSeals,
		reqSouls,
	};
}

export const upgradeGuild = async ({ context, client, options }: BaseProps) => {
	try {
		const author = options.author;
		const cooldownCommand = "upgrade-guild";
		const _inProgress = await getCooldown(author.id, cooldownCommand);
		if (_inProgress) {
			context.channel?.sendMessage(
				"You can use this command again after a minute."
			);
			return;
		}
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
			},
		};
		const buttons = await confirmationInteraction(
			context.channel,
			author.id,
			params,
			validateAndUpgradeGuild,
			(data, opts) => {
				if (data) {
					embed = createConfirmationEmbed(author, client).setDescription(
						`Are you sure you want to consume __${data.reqSouls}__ Souls ` +
              `and ${data.reqSeals} Dark Seals to evolve the bonus stats of your guild?`
					);
				}
				if (opts?.isDelete) {
					clearCooldown(author.id, cooldownCommand);
					sentMessage.deleteMessage();
				}
			}
		);
		if (!buttons) return;

		embed.setButtons(buttons);
		setCooldown(author.id, cooldownCommand);
		const msg = await context.channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.guild.upgrades.upgradeGuild(): something went wrong",
			err
		);
		return;
	}
};
