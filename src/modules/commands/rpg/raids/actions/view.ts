import { AuthorProps, ChannelProp } from "@customTypes";
import { CustomButtonInteractionParams } from "@customTypes/button";
import { SingleCanvasReturnType } from "@customTypes/canvas";
import { BaseProps } from "@customTypes/command";
import { RaidActionProps, RaidProps } from "@customTypes/raids";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { Canvas } from "canvas";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client, Message } from "discord.js";
import { createSingleCanvas, createBattleCanvas } from "helpers/canvas";
import { CONSOLE_BUTTONS } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { prepareRaidBossEmbedDesc, prepareRaidTimer, raidActions } from "..";
import { raidRecruit } from "../../guildEvents/recruit";
import { eventActions } from "../events";
import { validateCurrentRaid } from "./validateRaid";

const handleRaidViewButtons = async ({
	user_tag, client, channel, id, raidId, message
}: CustomButtonInteractionParams & { raidId?: number; }) => {
	const author = await client.users.fetch(user_tag);
	const disableRaids = await Cache.get("disable-raids");
	let isEvent = false;
	if (disableRaids) {
		isEvent = true;
	}
	const options = {
		context: {
			channel,
			guild: message.guild 
		} as BaseProps["context"],
		client,
		args: [] as string[],
		options: { author }
	};
	switch (id) {
		case CONSOLE_BUTTONS.RAID_JOIN.id: {
			if (!raidId) return;
			options.args = [ "join", `${raidId}` ];
			if (isEvent) {
				eventActions(options);
			} else {
				raidActions(options);
			}
			return;
		}
		case CONSOLE_BUTTONS.RAID_LEAVE.id: {
			options.args = [ "leave" ];
			if (isEvent) {
				eventActions(options);
			} else {
				raidActions(options);
			}
			return;	
		}
		case CONSOLE_BUTTONS.RAID_RECRUIT.id: {
			raidRecruit(options);
			return;	
		}
	} 
};

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

		const buttons = customButtonInteraction(
			context.channel,
			[
				{
					label: CONSOLE_BUTTONS.RAID_JOIN.label,
					params: {
						id: CONSOLE_BUTTONS.RAID_JOIN.id,
						raidId: currentRaid.id 
					}
				},
				{
					label: CONSOLE_BUTTONS.RAID_LEAVE.label,
					params: { id: CONSOLE_BUTTONS.RAID_LEAVE.id }
				},
				{
					label: CONSOLE_BUTTONS.RAID_RECRUIT.label,
					params: { id: CONSOLE_BUTTONS.RAID_RECRUIT.id }
				}
			],
			author.id,
			handleRaidViewButtons,
			() => {
				return;
			},
			true,
			10
		);

		if (buttons) {
			embed.setButtons(buttons);
		}
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