import { AuthorProps, ChannelProp } from "@customTypes";
import { SkinProps } from "@customTypes/skins";
import { delSkinCollection, getSkinCollectionById } from "api/controllers/SkinCollectionController";
import { getSkinById } from "api/controllers/SkinsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { Client, Message } from "discord.js";
import emoji from "emojis/emoji";
import { createConfirmationEmbed } from "helpers/confirmationEmbed";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE, ORB_INTEREST_RATE } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { confirmationInteraction } from "utility/ButtonInteractions";
import { getSkinArr, setSkinArr } from "./skinCache";

type P = {
  author: AuthorProps;
  id: number;
  channel: ChannelProp;
};
type O = {
  isConfirm: boolean;
};

async function processConfirmationAndGetOrbs(
	skin: SkinProps,
	author: AuthorProps,
	id: number
): Promise<number | undefined> {
	const resolvableOrbs = Math.floor(skin.price * ORB_INTEREST_RATE);
	const user = await getRPGUser({ user_tag: author.id });
	if (!user) return;
	user.orbs = user.orbs + resolvableOrbs;
	await delSkinCollection({ id });
	await updateRPGUser({ user_tag: user.user_tag }, { orbs: user.orbs });

	const skinArr = getSkinArr(author.id);
	if (skinArr) {
		const index = skinArr.findIndex((c: any) => c.id === id);
		if (index >= 0) {
			skinArr.splice(index, 1);
			setSkinArr(author.id, skinArr);
		}
	}

	return resolvableOrbs;
}

async function validateAndProcessResolveSkin(params: P, options?: O) {
	const skinCollection = await getSkinCollectionById({
		id: params.id,
		user_tag: params.author.id,
	});
	const embed = createEmbed().setTitle(DEFAULT_ERROR_TITLE).setAuthor({
		name: params.author.username,
		iconURL: params.author.displayAvatarURL(),
	});
	if (!skinCollection) {
		embed.setDescription(
			"We could not find the skin you were looking for in your collections."
		);
		params.channel?.sendMessage(embed);
		return;
	}
	const skin = await getSkinById({ id: skinCollection.skin_id });
	if (!skin) {
		embed.setDescription("This skin does not exist, please contact support");
		params.channel?.sendMessage(embed);
		return;
	}
	if (options?.isConfirm) {
		const resolvableOrbs = await processConfirmationAndGetOrbs(
			skin,
			params.author,
			params.id
		);
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`You have successfully resolved **${titleCase(
					skin.name
				)}** and received __${resolvableOrbs}__ Blue Orbs ${emoji.blueorb}`
			);

		if (!resolvableOrbs) {
			embed.setDescription(
				"Your Orbs have been processed!! You are one of the few who failed to receive a confirmation message"
			);
		}

		params.channel?.sendMessage(embed);
		return;
	}
	return skin;
}

export const resolveSkin = async (params: {
  channel: ChannelProp;
  author: AuthorProps;
  client: Client;
  args?: string[];
}) => {
	try {
		const id = params.args?.shift();
		if (!id) return;
		const funcParams = {
			author: params.author,
			channel: params.channel,
			id: Number(id),
		};
		let embed = createEmbed();
		let sentMessage: Message;
		const buttons = await confirmationInteraction<P, SkinProps>(
			params.channel,
			params.author.id,
			funcParams,
			validateAndProcessResolveSkin,
			(data, opts) => {
				if (data) {
					const resolvableOrbs = Math.floor(data.price * ORB_INTEREST_RATE);
					const desc = `Are you sure you want to resolve **${titleCase(
						data.name
					)}**? You will receive __${resolvableOrbs}__ Blue Orbs`;
					embed = createConfirmationEmbed(params.author, params.client)
						.setDescription(desc)
						.setThumbnail(data.filepath);
				}
				if (opts?.isDelete) {
					sentMessage.delete();
				}
			}
		);
		if (buttons) {
			embed.setButtons(buttons);
		}

		params.channel?.sendMessage(embed).then((msg) => {
			sentMessage = msg;
		});
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.skins.skinAction.resolve(): something went wrong",
			err
		);
		return;
	}
};
