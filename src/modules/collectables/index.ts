import {
	AuthorProps,
	ChannelProp,
} from "@customTypes";
import { CharacterCanvasProps } from "@customTypes/canvas";
import { RandomCardProps } from "@customTypes/cards";
import { getRandomCard } from "api/controllers/CardsController";
import { createCollection } from "api/controllers/CollectionsController";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { getRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client, Guild, Message } from "discord.js";
import { probability } from "helpers";
import { createSingleCanvas } from "helpers/canvas";
import {
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
} from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { collectableInteraction } from "utility/ButtonInteractions";
import { verifyDropChannels } from "./channels";

async function claimCard(
	params: RandomCardProps & { user_tag: string; channel: ChannelProp }
) {
	const claimerId = params.user_tag;
	if (!claimerId) return;
	const user = await getRPGUser({ user_tag: claimerId }, { cached: true });
	if (!user) {
		params.channel?.sendMessage(
			"You have not started your journey in the Xenverse! " +
        "Use ``iz start`` to be able to Claim cards!"
		);
		return;
	}
	const PL = await getPowerLevelByRank({ rank: params.rank });
	if (!PL) {
		params.channel?.sendMessage("This card was unclaimable!");
		return;
	}
	loggers.info(`Card ${params.name} claimed by: ${user.user_tag}`);
	await createCollection({
		is_item: false,
		is_favorite: false,
		user_id: user.id,
		character_id: params.character_id,
		character_level: STARTER_CARD_LEVEL,
		exp: STARTER_CARD_EXP,
		r_exp: STARTER_CARD_R_EXP,
		rank: params.rank,
		rank_id: PL.rank_id,
		is_on_cooldown: false,
		is_tradable: true
	});

	params.channel?.sendMessage(
		`__${titleCase(params.rank)}__ **${titleCase(params.name)}** ` +
      `has been added to **${user.username}'s** collection.`
	);
	return;
}

type T = {
  channel: ChannelProp;
  guild: Guild;
  client: Client;
  author: AuthorProps;
};
export const dropCollectables = async ({
	author,
	client,
	guild,
	channel,
}: T) => {
	try {
		const dropCard = [ true, false ];
		const dropRate = [ 2, 98 ];
		if (dropCard[probability(dropRate)]) {
			const dropChannel: any = await verifyDropChannels({
				client,
				guild,
				channel 
			});
			if (!dropChannel) return;
			const cardTypes = [ "silver", "gold", "platinum", "diamond" ];
			const probablilities = [ 20, 15, 10, 0.5 ];
			const rank = cardTypes[probability(probablilities)];
			const card = await getRandomCard(
				{
					rank,
					is_event: false,
					is_random: true,
					is_logo: false,
				},
				1
			);
			if (!card || card.length <= 0) {
				loggers.error("Failed to Spawn Drop Cards", rank);
				return;
			}
			const cardToDrop = card[0] as CharacterCanvasProps;
			loggers.info("Card Drop Spawned: ", cardToDrop);
			let sentMessage: Message;
			const canvas = createSingleCanvas(cardToDrop, true);
			if (!canvas) {
				throw new Error(
					"Failed to create canvas for: " + JSON.stringify(cardToDrop)
				);
			}
			const attachment = createAttachment(
				canvas.createJPEGStream(),
				"claim.jpg"
			);
			const embed = createEmbed(author, client)
				.setTitle("Random Card")
				.setDescription("_A wild card has appeared._")
				.attachFiles([ attachment ])
				.setImage("attachment://claim.jpg")
				.setFooter({ text: "Click on claim to claim this card" })
				.setHideConsoleButtons(true);

			const buttons = await collectableInteraction(
				dropChannel,
				card[0],
				claimCard,
				() => {
					sentMessage.deleteMessage();
				}
			);

			if (!buttons) return;
			embed.setButtons(buttons);

			dropChannel?.sendMessage(embed).then((msg: Message) => {
				sentMessage = msg;
			});
			return;
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.collectables.index.dropCollectables: ERROR",
			err
		);
		return;
	}
};
