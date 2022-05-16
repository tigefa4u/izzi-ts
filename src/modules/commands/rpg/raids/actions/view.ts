import { AuthorProps, ChannelProp } from "@customTypes";
import { SingleCanvasReturnType } from "@customTypes/canvas";
import { RaidActionProps, RaidProps } from "@customTypes/raids";
import { getRPGUser } from "api/controllers/UsersController";
import { Canvas } from "canvas";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import { createSingleCanvas, createBattleCanvas } from "helpers/canvas";
import loggers from "loggers";
import { titleCase } from "title-case";
import { prepareRaidBossEmbedDesc, prepareRaidTimer } from "..";
import { validateCurrentRaid } from "./validateRaid";

export const viewRaid = async ({ context, client, options, isEvent }: RaidActionProps) => {
	try {
		const author = options.author;
		const user = await getRPGUser({ user_tag: author.id }, { cached: true });
		if (!user) return;
		const currentRaid = await validateCurrentRaid(user.id, author, client, context.channel);
		if (!currentRaid) return;

		const embed = await prepareRaidViewEmbed({
			isEvent,
			author,
			client,
			channel: context.channel,
			currentRaid
		});
		if (!embed) return;
		context.channel?.sendMessage(embed);
        
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.actions.viewRaid(): something went wrong", err);
		return;
	}
};

export const prepareRaidViewEmbed = async ({
	isEvent,
	currentRaid,
	client,
	author,
	channel
}: {
    isEvent: boolean;
    currentRaid: RaidProps;
    channel: ChannelProp;
    author: AuthorProps;
    client: Client;
}) => {
	let bossCanvas: SingleCanvasReturnType | Canvas | undefined;
	if (isEvent) {
		bossCanvas = await createSingleCanvas(currentRaid.raid_boss[0], false);
	} else {
		bossCanvas = await createBattleCanvas(currentRaid.raid_boss, { isSingleRow: true });
	}
	if (!bossCanvas) {
	    channel?.sendMessage("Unable to view raid");
		return;
	}

	const attachment = createAttachment(bossCanvas.createJPEGStream(), "boss.jpg");
	const embed = createEmbed(author);
	embed.setTitle(`Raid View [${titleCase(currentRaid.stats.difficulty)}] ${prepareRaidTimer(currentRaid)}`)
		.setDescription(prepareRaidBossEmbedDesc(currentRaid, isEvent))
		.setImage("attachment://boss.jpg")
		.attachFiles([ attachment ])
		.setFooter({
			text: `Lobby code: ${currentRaid.id}`,
			iconURL: author.displayAvatarURL()
		});

	return embed;
};